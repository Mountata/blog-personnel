const errorMiddleware = (err, req, res, next) => {
  console.log('🔥 ERROR MIDDLEWARE APPELÉ');
  console.log('🔥 Message:', err.message);
  console.log('🔥 Stack:', err.stack);
  
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
};

module.exports = errorMiddleware;