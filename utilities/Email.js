const nodemailer=require('nodemailer');

const sendEmail=async(option)=>{

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: process.env.EMAIL_ADDRESS,
          pass: process.env.EMAIL_PASSWORD,
          clientId: process.env.OAUTH_CLIENT_ID,
          clientSecret: process.env.OAUTH_CLIENT_SECRET,
          accessToken: process.env.OAUTH_ACCESS_TOKEN,
          refreshToken: process.env.OAUTH_REFRESH_TOKEN
        }
      });


    const mailOptions = {
      from: 'Hossein fouladi)',
      to: option.email,
      subject: 'forgot your password?click to below link to reset your pssword',
      text: option.message
    };

    await transporter.sendMail(mailOptions);
}

module.exports=sendEmail;