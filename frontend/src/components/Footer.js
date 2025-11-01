import React from 'react';
import { Link } from 'react-router-dom';
import { FiGithub, FiTwitter, FiLinkedin, FiHeart } from 'react-icons/fi';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 dark:bg-gray-950 text-white py-12 mt-16 border-t border-gray-800 dark:border-gray-700">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About Section */}
          <div>
            <h3 className="text-xl font-semibold mb-4 text-primary-400">BlogPlatform</h3>
            <p className="text-gray-300 leading-relaxed">
              A modern blogging platform where writers can share their stories,
              ideas, and connect with readers from around the world.
            </p>
            <div className="flex space-x-4 mt-6">
              <a
                href="#"
                className="text-gray-400 hover:text-primary-400 transition-colors"
                aria-label="GitHub"
              >
                <FiGithub className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-primary-400 transition-colors"
                aria-label="Twitter"
              >
                <FiTwitter className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-primary-400 transition-colors"
                aria-label="LinkedIn"
              >
                <FiLinkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-gray-300 hover:text-primary-400 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/create" className="text-gray-300 hover:text-primary-400 transition-colors">
                  Write a Blog
                </Link>
              </li>
              <li>
                <Link to="/profile" className="text-gray-300 hover:text-primary-400 transition-colors">
                  Profile
                </Link>
              </li>
              <li>
                <Link to="/admin" className="text-gray-300 hover:text-primary-400 transition-colors">
                  Admin Panel
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <div className="text-gray-300 space-y-2">
              <p>Email: info@blogplatform.com</p>
              <p>Follow us on social media for updates</p>
              <p className="text-sm text-gray-400">
                Built with <FiHeart className="inline w-4 h-4 text-red-500" /> for the developer community
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 dark:border-gray-700 mt-8 pt-8 text-center">
          <p className="text-gray-400">
            © {currentYear} BlogPlatform. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
