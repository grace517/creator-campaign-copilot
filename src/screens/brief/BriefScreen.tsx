import { Link, useParams } from 'react-router';
import { ScreenHead } from '../Placeholders';
import { BrandKitCard } from './BrandKitCard';
import { BriefFields } from './BriefFields';
import { StarterDms } from './StarterDms';

export function BriefScreen() {
  const { campaignId = '' } = useParams();
  return (
    <>
      <ScreenHead
        title="Brief"
        action={
          <Link className="btn-primary" to={`/campaigns/${campaignId}/roster`}>
            Next: pick creators
          </Link>
        }
      />
      <div className="brief-layout">
        <section aria-label="Brief" className="brief-layout__main">
          <BrandKitCard />
          <BriefFields />
        </section>
        <StarterDms />
      </div>
    </>
  );
}
