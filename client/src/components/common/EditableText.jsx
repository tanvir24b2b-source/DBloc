import { useContent } from "../../store/ContentContext.jsx";

/**
 * Renders CMS-driven content. In normal mode → just the text.
 * In admin edit mode → wrapped with a click-to-edit overlay.
 *
 * Props:
 *  - keyName: content key (e.g. "hero.headline1")
 *  - fallback: default text if key missing
 *  - as: element tag (default span)
 *  - className: passthrough
 */
export default function EditableText({ keyName, fallback = "", as: Tag = "span", className = "", ...rest }) {
  const { map, editMode, requestEdit } = useContent();
  const value = map[keyName] ?? fallback;

  if (!editMode) {
    return (
      <Tag className={className} {...rest}>
        {value}
      </Tag>
    );
  }

  return (
    <Tag
      className={`cms-editable ${className}`}
      title={`Edit: ${keyName}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        requestEdit(keyName);
      }}
      {...rest}
    >
      {value}
    </Tag>
  );
}
