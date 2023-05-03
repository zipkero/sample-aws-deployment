db.createUser({
  user: "root",
  pwd: "1q2w3e",
  roles: [
    {
      role: "readWrite",
      db: "example",
    },
  ],
});
