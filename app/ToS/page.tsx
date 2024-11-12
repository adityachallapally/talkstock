import React from 'react';

const TermsOfService: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
      
      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">1. Acceptance of Terms</h2>
        <p>By accessing or using our AI video creation web app, you agree to be bound by these Terms of Service.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">2. Data Handling and Privacy</h2>
        <p>We handle your data in accordance with the following principles:</p>
        <ul className="list-disc pl-6">
          <li>Data is only used to provide or improve user-facing features that are prominent in our app&apos;s interface.</li>
          <li>We do not transfer your data, except:
            <ul className="list-circle pl-6">
              <li>To improve our services with your consent;</li>
              <li>For security purposes;</li>
              <li>To comply with applicable laws;</li>
              <li>As part of a merger, acquisition, or sale of assets (with your prior consent).</li>
            </ul>
          </li>
          <li>Our staff does not read your data unless:
            <ul className="list-circle pl-6">
              <li>You&apos;ve given explicit permission;</li>
              <li>It&apos;s necessary for security purposes;</li>
              <li>It&apos;s required to comply with applicable laws;</li>
              <li>The data is aggregated and used for internal operations in compliance with privacy laws.</li>
            </ul>
          </li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">3. Prohibited Data Uses</h2>
        <p>We strictly prohibit:</p>
        <ul className="list-disc pl-6">
          <li>Transferring or selling user data to third parties;</li>
          <li>Using user data for advertising purposes;</li>
          <li>Using user data for credit assessments or lending purposes.</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">4. AI Video Creation</h2>
        <p>Our app uses AI to create videos. By using this service, you agree that:</p>
        <ul className="list-disc pl-6">
          <li>You have the right to use any content you upload for video creation;</li>
          <li>You will not use our service to create illegal, offensive, or harmful content;</li>
          <li>We retain the right to remove any content that violates these terms.</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">5. Intellectual Property</h2>
        <p>You retain rights to your original content. However, you grant us a license to use, modify, and distribute the videos created using our service as necessary to provide and improve our services.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">6. Limitation of Liability</h2>
        <p>We provide this service &ldquo;as is&rdquo; and are not liable for any damages or losses resulting from your use of our app.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">7. Changes to Terms</h2>
        <p>We may update these terms from time to time. Continued use of our service after changes constitutes acceptance of the new terms.</p>
      </section>
    </div>
  );
};

export default TermsOfService;
