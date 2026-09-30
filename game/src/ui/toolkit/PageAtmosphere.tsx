import './page-atmosphere.css';

/** Ambient light behind menu surfaces, independent of any model preview. */
export function PageAtmosphere({ animated = true }: { animated?: boolean }) {
  return <div className="ui-page-atmosphere" data-animated={animated} aria-hidden="true">
    <div className="ui-page-atmosphere__light ui-page-atmosphere__light--blue" />
    <div className="ui-page-atmosphere__light ui-page-atmosphere__light--green" />
    <div className="ui-page-atmosphere__lattice" />
  </div>;
}
