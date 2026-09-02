module.exports = {
  apps: [
    {
      name: "backend",
      script: "npm",
      args: "start",
      cwd: "./backend",
      env: {
        NODE_ENV: "production",
        PORT: 5000
      }
    },
    {
      name: "frontend",
      script: "npm",
      args: "start",
      cwd: "./frontend",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    }
  ]
};
