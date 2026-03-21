const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    
    // ✅ Log pour déboguer
    console.log('URI chargée:', uri ? '✅ OUI' : '❌ NON - undefined');
    
    if (!uri) {
      throw new Error('MONGO_URI est undefined — vérifie ton fichier .env');
    }

    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB connecté : ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Erreur MongoDB : ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;