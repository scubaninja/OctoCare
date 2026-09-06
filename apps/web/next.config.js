/** @type {import('next').NextConfig} */
const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL;

if (process.env.NODE_ENV === 'production' && !apiUrl) {
  throw new Error('NEXT_PUBLIC_API_URL or API_URL must be set for production builds.');
}

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
