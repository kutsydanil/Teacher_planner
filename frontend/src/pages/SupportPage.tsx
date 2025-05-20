import React, { useState } from 'react';
import { Send, Mail, MessageSquare, HelpCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';

const SupportPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you would send the form data to your backend
    console.log({ name, email, message });
    setSubmitted(true);
    // Reset form
    setName('');
    setEmail('');
    setMessage('');
  };

  const faqs = [
    {
      question: "How do I connect to Google Calendar?",
      answer: "After signing in with your Google account, our app automatically connects to your Google Calendar. You can check the connection status in your Settings page."
    },
    {
      question: "Can I export my schedule statistics?",
      answer: "Yes! You can export your data in Excel format from the Statistics page. Look for the export button at the top of the monthly data table."
    },
    {
      question: "How do I create a new group?",
      answer: "Navigate to the Groups section, click the 'Add Group' button, and fill in the details. You can also set a custom color to help visualize this group in your calendar."
    },
    {
      question: "What happens if I delete a group or subject?",
      answer: "When you delete a group or subject, all associated events remain in your calendar but are marked as orphaned. You can reassign these events or delete them individually."
    }
  ];

  return (
    <div className="bg-white dark:bg-gray-900 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
            Support & Help Center
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-600 dark:text-gray-400">
            We're here to help you get the most out of TeacherPlanner.
          </p>
        </div>
        
        <div className="mt-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* FAQ Section */}
            <div>
              <div className="flex items-center mb-6">
                <HelpCircle className="h-6 w-6 text-primary-600 dark:text-primary-400 mr-2" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Frequently Asked Questions</h2>
              </div>
              
              <div className="space-y-6">
                {faqs.map((faq, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{faq.question}</h3>
                    <p className="text-gray-600 dark:text-gray-400">{faq.answer}</p>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 flex items-center bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
                <MessageSquare className="h-6 w-6 text-primary-600 dark:text-primary-400 mr-2" />
                <p className="text-sm text-gray-800 dark:text-gray-200">
                  Can't find an answer? Use the contact form to reach our support team.
                </p>
              </div>
            </div>
            
            {/* Contact Form */}
            <div>
              <div className="flex items-center mb-6">
                <Mail className="h-6 w-6 text-primary-600 dark:text-primary-400 mr-2" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Contact Us</h2>
              </div>
              
              {submitted ? (
                <div className="bg-success-50 dark:bg-success-900/20 p-6 rounded-lg border border-success-200 dark:border-success-800">
                  <h3 className="text-lg font-medium text-success-800 dark:text-success-200 mb-2">Message Sent!</h3>
                  <p className="text-success-600 dark:text-success-400">
                    Thank you for contacting us. We'll get back to you as soon as possible.
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setSubmitted(false)}
                  >
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6 bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 ">
                  <Input
                    label="Name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Your name"
                    className="py-2 px-4"
                  />
                  
                  <Input
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="your.email@example.com"
                    className="py-2 px-4"
                  />
                  
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      How can we help you?
                    </label>
                    <Textarea
                      id="message"
                      name="message"
                      rows={4}
                      className="block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:text-white text-sm py-2 px-4"
                      placeholder="Describe your issue or question"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    rightIcon={<Send className="h-4 w-4" />}
                    className="w-full"
                  >
                    Send Message
                  </Button>
                </form>
              )}
              
              <div className="mt-8 bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Alternative Contact Methods</h3>
                <div className="flex items-center mb-4">
                  <Mail className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-3" />
                  <a href="mailto:support@teacherplanner.com" className="text-primary-600 dark:text-primary-400 hover:underline">
                    support@teacherplanner.com
                  </a>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Our support team typically responds within 24 hours on business days.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportPage;