import admin from 'firebase-admin';

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

if (!serviceAccountJson) {
  console.error('FIREBASE_SERVICE_ACCOUNT_JSON is not set. Run with: node --env-file=.env scripts/seed-developer-users.mjs');
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(serviceAccountJson))
  });
}

const auth = admin.auth();
const db = admin.firestore();
const nowSeconds = Math.floor(Date.now() / 1000);

const developerUsers = [
  {
    email: 'okemmanuel@kneesupvenues.com',
    password: 'Emmanuel@2@',
    firstName: 'Okemmanuel',
    lastName: 'Developer'
  },
  {
    email: 'developer@kneesupvenues.com',
    password: 'Developer@2@',
    firstName: 'Platform',
    lastName: 'Developer'
  }
];

async function upsertDeveloperUser(user) {
  let authUser;
  let action = 'created';

  try {
    authUser = await auth.getUserByEmail(user.email);
    action = 'updated';

    await auth.updateUser(authUser.uid, {
      password: user.password,
      displayName: `${user.firstName} ${user.lastName}`,
      emailVerified: true,
      disabled: false
    });
  } catch (error) {
    if (error?.code !== 'auth/user-not-found') {
      throw error;
    }

    authUser = await auth.createUser({
      email: user.email,
      password: user.password,
      displayName: `${user.firstName} ${user.lastName}`,
      emailVerified: true,
      disabled: false
    });
  }

  await db.collection('user').doc(authUser.uid).set(
    {
      email: user.email,
      userRole: 'Developer',
      adminRole: 'developer',
      profile: {
        firstName: user.firstName,
        lastName: user.lastName
      },
      createdAt: nowSeconds,
      updatedAt: nowSeconds,
      isActive: true
    },
    { merge: true }
  );

  console.log(`${action.toUpperCase()}: ${user.email} (uid: ${authUser.uid})`);
}

async function main() {
  for (const user of developerUsers) {
    await upsertDeveloperUser(user);
  }

  console.log('DONE: developer users are ready for login.');
}

main().catch((error) => {
  console.error('FAILED:', error);
  process.exit(1);
});
