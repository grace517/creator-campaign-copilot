import { brandKit } from '../../data';
import { useBrief } from '../../state/BriefContext';

/** The brand kit's rules as this brief uses them, read-only here; they're edited in Brand kit. */
export function BrandKitCard() {
  const { brief } = useBrief();
  return (
    <div className="card brief-card">
      <div className="brief-card__head">
        <h2 className="card-title">Brand kit</h2>
        <span className="pill pill--green">Prefilled from your brand kit</span>
      </div>
      <div className="field-grid">
        <div>
          <div className="label">Voice</div>
          <div>{brandKit.voice}</div>
        </div>
        <div>
          <div className="label">Disclosure</div>
          <div>
            {brief.disclosure}, {brandKit.disclosure_placement}
          </div>
        </div>
      </div>
      <div>
        <div className="label label--spaced" id="approved-claims">
          Approved claims
        </div>
        <ul className="chips" aria-labelledby="approved-claims">
          {brief.approved_claims.map((c) => (
            <li key={c} className="chip chip--green">
              {c}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <div className="label label--spaced" id="banned-claims">
          Banned claims
        </div>
        <ul className="chips" aria-labelledby="banned-claims">
          {brief.banned_claims.map((c) => (
            <li key={c} className="chip chip--red">
              {c}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
