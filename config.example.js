// config.example.js
// Template showing what goes in config.js
// config.js is gitignored — never committed

window.__ENV__ = {

  // From Google Cloud → IAM → Service Accounts → your account → Email
  SA_EMAIL: 'your-service-account@your-project.iam.gserviceaccount.com',

  // From Google Cloud → IAM → Service Accounts → your account → Keys → JSON download → private_key
  // Include the full -----BEGIN----- and -----END----- lines
  SA_KEY: `-----BEGIN PRIVATE KEY-----
paste full key here
-----END PRIVATE KEY-----
`,

  // From the Google Sheet URL — already set for tęsknota
  SPREADSHEET_ID: '1QUUSvFZvLvdS6b9XZgRfO1JKyqGKWMi4j7HiZuHOyas',

  // From https://console.anthropic.com → API Keys
  ANTHROPIC_API_KEY: 'sk-ant-...',

};
