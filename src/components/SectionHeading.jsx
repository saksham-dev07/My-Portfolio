import { Children, cloneElement, isValidElement } from "react";

function choreographTitle(title) {
  let order = 0;
  const walk = (node) => {
    if (typeof node === "string")
      return node.split(/(\s+)/).map((word, index) =>
        word.trim() ? (
          <span
            className="heading-word"
            key={`${word}-${index}`}
            style={{ "--word-order": order++ }}
          >
            <span>{word}</span>
          </span>
        ) : (
          word
        ),
      );
    if (!isValidElement(node) || !node.props.children) return node;
    return cloneElement(node, {}, Children.map(node.props.children, walk));
  };
  return walk(title);
}

export default function SectionHeading({
  number,
  label,
  title,
  description,
  children,
}) {
  return (
    <div className="section-heading">
      <div>
        <p className="eyebrow">
          <span className="section-number">{number}</span>
          {label}
        </p>
        <h2>{choreographTitle(title)}</h2>
        {description && <p className="section-description">{description}</p>}
      </div>
      {children}
    </div>
  );
}
