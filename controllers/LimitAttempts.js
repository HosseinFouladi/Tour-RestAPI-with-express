const redis = require('redis');
const { RateLimiterRedis } = require('rate-limiter-flexible');
const passport = require('passport');

// create a Redis client - connect to Redis (will be done later in this tutorial)
const redisClient = redis.createClient(process.env.REDIS_URL, {
  enable_offline_queue: false
});

// if no connection, an error will be emitted
// handle connection errors
redisClient.on('error', err => {
  console.log(err);
  // this error is handled by an error handling function that will be explained later in this tutorial
  return new Error();
});

const maxWrongAttemptsByIPperDay = 10;
const maxConsecutiveFailsByEmailAndIP = 10; 

// the rate limiter instance counts and limits the number of failed logins by key
const limiterSlowBruteByIP = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'login_fail_ip_per_day',
  // maximum number of failed logins allowed. 1 fail = 1 point
  // each failed login consumes a point
  points: maxWrongAttemptsByIPperDay,
  // delete key after 24 hours
  duration: 60 * 60 * 24,
  // number of seconds to block route if consumed points > points
  blockDuration: 60 * 60 * 24 // Block for 1 day, if 100 wrong attempts per day
});

const limiterConsecutiveFailsByEmailAndIP = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'login_fail_consecutive_email_and_ip',
  points: maxConsecutiveFailsByEmailAndIP,
  duration: 60 * 60, // Delete key after 1 hour
  blockDuration: 60 * 60 // Block for 1 hour
});

// create key string
const getEmailIPkey = (email, ip) => `${email}_${ip}`;

// rate-limiting middleware controller
exports.loginRouteRateLimit = async (req, res, next) => {
  const ipAddr = req.ip;
  const emailIPkey = getEmailIPkey(req.body.email, ipAddr);

  // get keys for attempted login
  const [resEmailAndIP, resSlowByIP] = await Promise.all([
    limiterConsecutiveFailsByEmailAndIP.get(emailIPkey),
    limiterSlowBruteByIP.get(ipAddr)
  ]);

  let retrySecs = 0;
  // Check if IP or email + IP is already blocked
  if (
    resSlowByIP !== null &&
    resSlowByIP.consumedPoints > maxWrongAttemptsByIPperDay
  ) {
    retrySecs = Math.round(resSlowByIP.msBeforeNext / 1000) || 1;
  } else if (
    resEmailAndIP !== null &&
    resEmailAndIP.consumedPoints > maxConsecutiveFailsByEmailAndIP
  ) {
    retrySecs = Math.round(resEmailAndIP.msBeforeNext / 1000) || 1;
  }

  // the IP and email + ip are not rate limited  
  if (retrySecs > 0) {
    // sets the response’s HTTP header field
    res.set('Retry-After', String(retrySecs));
    res
      .status(429)
      .send(`Too many requests. Retry after ${retrySecs} seconds.`);
  } else {
    passport.authenticate('local', async function(err, user) {
      if (err) {
        return next(err);
      }
           if (!user) {
        // Consume 1 point from limiters on wrong attempt and block if limits reached
        try {
          const promises = [limiterSlowBruteByIP.consume(ipAddr)];
          // check if user exists by checking if authentication failed because of an incorrect password
          if (info.name === 'IncorrectPasswordError') {
            console.log('failed login: not authorized');
            // Count failed attempts by Email + IP only for registered users
            promises.push(
              limiterConsecutiveFailsByEmailAndIP.consume(emailIPkey)
            );
          }
          // if user does not exist (not registered)
          if (info.name === 'IncorrectUsernameError') {
            console.log('failed login: user does not exist');
          }

          await Promise.all(promises);
          req.flash('error', 'Email or password is wrong.');
          res.redirect('users/login');
        } catch (rlRejected) {
          if (rlRejected instanceof Error) {
            throw rlRejected;
          } else {
            const timeOut =
              String(Math.round(rlRejected.msBeforeNext / 1000)) || 1;
            res.set('Retry-After', timeOut);
            res
              .status(429)
              .send(`Too many login attempts. Retry after ${timeOut} seconds`);
          }
        }
      }
      // If passport authentication successful
      if (user) {
        console.log('successful login');
        if (resEmailAndIP !== null && resEmailAndIP.consumedPoints > 0) {
          // Reset limiter based on IP + email on successful authorisation
          await limiterConsecutiveFailsByEmailAndIP.delete(emailIPkey);
        }
        // login (Passport.js method)
        req.logIn(user, function(err) {
          if (err) {
            return next(err);
          }
          return res.redirect('/');
        });
      }
    })(req, res, next);
  }
};