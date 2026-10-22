import { Link } from "@tanstack/react-router";

import { LINK_LIST_CLASS, LINK_ROW_CLASS, LinkRowContent } from "../components/LinkList";

interface ComparisonListProps {
  comparisons: readonly { slug: string; shortTitle: string; tagline: string }[];
  className?: string;
}

/** Every comparison, as the hub and the foot of each comparison both list them. */
export default function ComparisonList({ comparisons, className }: ComparisonListProps) {
  return (
    <ul className={`${LINK_LIST_CLASS} ${className ?? ""}`}>
      {comparisons.map((comp) => (
        <li key={comp.slug}>
          <Link to="/compare/$slug" params={{ slug: comp.slug }} className={LINK_ROW_CLASS}>
            <LinkRowContent title={comp.shortTitle} description={comp.tagline} />
          </Link>
        </li>
      ))}
    </ul>
  );
}
