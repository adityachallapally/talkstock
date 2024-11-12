import React from 'react';
import Link from 'next/link';

const PrivacyPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      
      <p className="mb-4">
        Last updated: {new Date().toLocaleDateString()}
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-4">1. Introduction</h2>
      <p className="mb-4">
        This Privacy Policy describes how [Your Company Name] (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) collects, uses, and shares information about you when you use our [website/application] (the &ldquo;Service&rdquo;).
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-4">2. Information We Collect</h2>
      <p className="mb-4">
        We collect information you provide directly to us, such as when you create an account, use our Service, or communicate with us. This may include:
      </p>
      <ul className="list-disc list-inside mb-4">
        <li>Personal information (e.g., name, email address)</li>
        <li>Usage information</li>
        <li>Device information</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-6 mb-4">3. How We Use Your Information</h2>
      <p className="mb-4">
        We use the information we collect to:
      </p>
      <ul className="list-disc list-inside mb-4">
        <li>Provide, maintain, and improve our Service</li>
        <li>Communicate with you about our Service</li>
        <li>Protect against fraud and unauthorized access</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-6 mb-4">4. Google User Data</h2>
      <p className="mb-4">
        Our Service uses Google Sign-In and accesses certain Google user data. We adhere to Google&apos;s Limited Use requirements:
      </p>
      <ul className="list-disc list-inside mb-4">
        <li>We only request access to the Google user data that is necessary for our Service to function</li>
        <li>We use Google user data solely to provide and improve our Service</li>
        <li>We do not sell Google user data</li>
        <li>We do not use Google user data for advertising purposes</li>
        <li>We do not transfer Google user data to third parties, except as necessary to provide and improve our Service</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-6 mb-4">5. Updates to This Policy</h2>
      <p className="mb-4">
        We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &ldquo;Last updated&rdquo; date at the top of this policy.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-4">6. Contact Us</h2>
      <p className="mb-4">
        If you have any questions about this Privacy Policy, please contact us at:
      </p>
      <p className="mb-4">
        [Your Company Name]<br />
        [Your Address]<br />
        [Your Email]<br />
        [Your Phone Number]
      </p>

      <p className="mt-8">
        <Link href="/" className="text-blue-600 hover:underline">
          Return to Homepage
        </Link>
      </p>
    </div>
  );
};

export default PrivacyPage;
