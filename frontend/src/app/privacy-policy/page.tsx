
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PrivacyPolicyPage() {
  return (
    <main className="flex-grow py-16 sm:py-20 lg:py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-white">Privacy Policy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-invert prose-lg max-w-none text-muted-foreground">
              <p>Last updated: {new Date().toLocaleDateString()}</p>

              <h2>1. Introduction</h2>
              <p>
                Welcome to GearUp. We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about our policy, or our practices with regards to your personal information, please contact us.
              </p>

              <h2>2. Information We Collect</h2>
              <p>
                We collect personal information that you voluntarily provide to us when you register on the website, express an interest in obtaining information about us or our products and services, when you participate in activities on the website or otherwise when you contact us.
              </p>

              <h2>3. How We Use Your Information</h2>
              <p>
                We use personal information collected via our website for a variety of business purposes described below. We process your personal information for these purposes in reliance on our legitimate business interests, in order to enter into or perform a contract with you, with your consent, and/or for compliance with our legal obligations.
              </p>
              
              <h2>4. Will Your Information Be Shared With Anyone?</h2>
              <p>
                  We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations.
              </p>
              
              <h2>5. How Long Do We Keep Your Information?</h2>
              <p>
                  We keep your information for as long as necessary to fulfill the purposes outlined in this privacy policy unless otherwise required by law.
              </p>

              <h2>6. How Do We Keep Your Information Safe?</h2>
              <p>
                  We aim to protect your personal information through a system of organizational and technical security measures.
              </p>
              
              <h2>7. Contact Us</h2>
              <p>
                If you have questions or comments about this policy, you may email us at privacy@gearup.example.com.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
