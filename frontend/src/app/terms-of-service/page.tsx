
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TermsOfServicePage() {
  return (
    <main className="flex-grow py-16 sm:py-20 lg:py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
         <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-white">Terms of Service</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-invert prose-lg max-w-none text-muted-foreground">
              <p>Last updated: {new Date().toLocaleDateString()}</p>

              <h2>1. Agreement to Terms</h2>
              <p>
                By using our services, you agree to be bound by these Terms. If you don’t agree to be bound by these Terms, do not use the services.
              </p>

              <h2>2. Privacy Policy</h2>
              <p>
                Please refer to our Privacy Policy for information on how we collect, use and disclose information from our users. You acknowledge and agree that your use of the services is subject to our Privacy Policy.
              </p>

              <h2>3. Changes to Terms or Services</h2>
              <p>
                We may update the Terms at any time, in our sole discretion. If we do so, we’ll let you know either by posting the updated Terms on the Site or through other communications.
              </p>
              
              <h2>4. Who May Use the Services</h2>
              <p>
                  You may use the services only if you are 13 years or older and are not barred from using the services under applicable law.
              </p>
              
              <h2>5. Content Ownership</h2>
              <p>
                  We do not claim any ownership rights in any User Content and nothing in these Terms will be deemed to restrict any rights that you may have to use and exploit your User Content.
              </p>

              <h2>6. Prohibited Conduct</h2>
              <p>
                  You agree not to do any of the following: post, upload, publish, submit or transmit any Content that infringes, misappropriates or violates a third party’s patent, copyright, trademark, trade secret, moral rights or other intellectual property rights, or rights of publicity or privacy.
              </p>
              
              <h2>7. Contact Information</h2>
              <p>
                If you have any questions about these Terms, please contact us at support@gearup.example.com.
              </p>
            </div>
          </CardContent>
         </Card>
      </div>
    </main>
  );
}
