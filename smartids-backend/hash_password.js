import bcrypt from "bcryptjs";

// ⚠️ CHANGE THIS to the actual password you want to use for the admin
const password = "admin1234"; // Updated to the user's desired password

async function hashAndPrint() {
    try {
        const salt = await bcrypt.genSalt(10); // Use the same salt factor as your controller
        const hashedPassword = await bcrypt.hash(password, salt);
        
        console.log("---");
        console.log(`Original Password: ${password}`);
        console.log(`Hashed Password (COPY THIS): ${hashedPassword}`);
        console.log("---");

        // The process module needs to be imported if you're running this as a script in Node environments that require it
        // process.exit(0); 
    } catch (error) {
        console.error("Hashing failed:", error);
    }
}

hashAndPrint();

// To run this file, you must use an environment that supports ES modules (like 'type: module' in package.json)
// Command: node hash_password.js 
