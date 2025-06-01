db = db.getSiblingDB(process.env.MONGO_INITDB_DATABASE || 'doc2formjson'); // Connect to/create the app database

const appUser = process.env.MONGODB_APP_USERNAME;
const appPasswordFile = process.env.MONGODB_APP_PASSWORD_FILE;

if (!appUser || !appPasswordFile) {
    printjson({ error: 'MONGODB_APP_USERNAME or MONGODB_APP_PASSWORD_FILE environment variables not set.' });
    quit(1);
}

let appPassword;
try {
    appPassword = cat(appPasswordFile).trim();
} catch (e) {
    printjson({ error: `Failed to read password from ${appPasswordFile}`, details: e });
    quit(1);
}

if (!appPassword) {
    printjson({ error: `Password file ${appPasswordFile} is empty.` });
    quit(1);
}

// Check if user already exists
const existingUser = db.getUser(appUser);

if (existingUser) {
    printjson({ message: `User ${appUser} already exists in database ${db.getName()}. Skipping creation.` });
} else {
    try {
        db.createUser({
            user: appUser,
            pwd: appPassword,
            roles: [
                { role: 'readWrite', db: db.getName() }
            ]
        });
        printjson({ success: `User ${appUser} created successfully for database ${db.getName()}.` });
    } catch (e) {
        printjson({ error: `Failed to create user ${appUser}`, details: e });
        quit(1);
    }
}

// As an example, you might want to create a collection if it doesn't exist
// if (!db.getCollectionNames().includes('mycollection')) {
//   db.createCollection('mycollection');
//   printjson({ success: 'Created collection: mycollection' });
// }
