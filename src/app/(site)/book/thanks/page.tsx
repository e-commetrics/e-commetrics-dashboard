import PageHero from '@/site/components/PageHero';
import Button from '@/site/components/Button';
import { pageMeta } from '@/site/lib/meta';

export const metadata = pageMeta({ title: 'Brief received', description: 'Thanks, your brief reached us.', path: '/book/thanks', noindex: true });

export default function ThanksPage() {
  return (
    <PageHero
      eyebrow="Brief received"
      title="Thanks. It’s on a senior engineer’s desk."
      lead="We’ll reply within one business day with times for your diagnosis, in Pacific time. If it’s urgent, say so in a reply to our email."
    >
      <Button href="/" variant="light" icon={null}>Back to the homepage</Button>
      <Button href="/#pricing" variant="secondary" icon={null}>Review pricing meanwhile</Button>
    </PageHero>
  );
}
