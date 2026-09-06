/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  env: {
    API_URL: process.env.API_URL || 'http://localhost:8080',
  },
  async headers() {
    return [
      {
        source: '/.well-known/replay-qa-security-nonce',
        headers: [
          {
            key: 'Content-Type',
            value: 'text/plain; charset=utf-8',
          },
        ],
      },
    ];
  },
};
module.exports = nextConfig;
