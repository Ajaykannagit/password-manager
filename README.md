# Password Manager

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Status](https://img.shields.io/badge/Status-Active-success?style=for-the-badge)
![Security](https://img.shields.io/badge/Security-Encrypted-brightgreen?style=for-the-badge)

A secure and user-friendly password manager application built with TypeScript. Store, manage, and protect your passwords with encryption.

## 🔐 Features

- 🔒 **Secure Encryption** - Passwords encrypted before storage
- 🔑 **Password Generation** - Generate strong, random passwords
- 📱 **Cross-Platform** - Works on desktop and mobile
- 🎨 **Modern UI** - Clean and intuitive interface
- 🔍 **Search & Filter** - Easily find stored passwords
- 📋 **Copy to Clipboard** - Quick access to credentials
- 🌐 **Browser Extension** (Optional) - Quick access from browser
- 📊 **Password Strength Analyzer** - Check password strength
- 🔄 **Import/Export** - Backup and restore your data

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ and npm
- TypeScript (included as dev dependency)

### Installation

```bash
# Clone the repository
git clone https://github.com/Ajaykannagit/password-manager.git
cd password-manager

# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode
npm run dev
```

### Building for Production

```bash
npm run build
npm start
```

## 📁 Project Structure

```
password-manager/
├── src/
│   ├── components/
│   ├── services/
│   ├── utils/
│   ├── types/
│   └── main.ts
├── public/
├── dist/
├── package.json
├── tsconfig.json
└── README.md
```

## 🛠️ Technologies Used

- **TypeScript** - Type-safe JavaScript
- **React/Vue/Angular** - Frontend framework (if applicable)
- **CryptoJS/Web Crypto API** - Encryption
- **IndexedDB/LocalStorage** - Data storage
- Additional dependencies as listed in package.json

## 🔒 Security Features

- ✅ AES encryption for password storage
- ✅ Master password hashing (bcrypt/argon2)
- ✅ No plain-text password storage
- ✅ Secure random password generation
- ✅ Auto-lock after inactivity
- ✅ Optional two-factor authentication

## 📖 Usage

### Adding a Password

```typescript
import { PasswordManager } from './services/password-manager';

const manager = new PasswordManager();
await manager.addPassword({
  title: 'GitHub',
  username: 'user@example.com',
  password: 'secure-password',
  url: 'https://github.com'
});
```

### Generating a Password

```typescript
const password = manager.generatePassword({
  length: 16,
  includeUppercase: true,
  includeLowercase: true,
  includeNumbers: true,
  includeSymbols: true
});
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Security Notice

**Important:** This is a demonstration project. For production use, please:
- Conduct thorough security audits
- Use established security libraries
- Follow security best practices
- Regularly update dependencies

## 👤 Author

**Ajaykannan**

- GitHub: [@Ajaykannagit](https://github.com/Ajaykannagit)

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

## 🙏 Acknowledgments

- Security community for best practices
- Open-source encryption libraries

---

⭐ Star this repo if you find it helpful!

🔒 **Keep your passwords safe!**
