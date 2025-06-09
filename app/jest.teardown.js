require('dotenv').config();
const mongoose = require("mongoose");
const User = require("./models/user");

module.exports = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        const result = await User.deleteMany({
            $or: [
                { email: { $regex: /^sorvegliante\.test\d+@comune\.it$/ } },
                { email: { $regex: /^dipendente\.test\d+@comune\.it$/ } },
                { email: { $regex: /^testdipendente\d+@comune\.it$/ } },
                { email: { $regex: /^testsorvegliante\d+@comune\.it$/ } },
                { email: { $regex: /^testchangepass\d+@comune\.it$/ } },
                { email: { $regex: /^utente\.eliminazione\d+@comune\.it$/ } },
                { email: { $regex: /^sorvegliante\.modifica\d+@comune\.it$/ } },
                { email: { $regex: /^testuser\d+@comune\.it$/ } }
            ]
        });

        console.log(`\nTest cleanup: eliminati ${result.deletedCount} utenti di test`);
        
        await mongoose.connection.close();
    } catch (error) {
        console.error("Errore durante cleanup:", error);
    }
};