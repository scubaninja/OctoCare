/** @type {import('next').NextConfig} */
const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || '';

const nextConfig = {
  output: 'standalone',
  env: {
    NEXT_PUBLIC_API_URL: apiUrl,
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
