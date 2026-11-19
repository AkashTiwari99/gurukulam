"""HTML Parser and DOM Tree Utilities.

Pure Python 3 standard library HTMLParser subclass building a DOMNode tree
with structural query capabilities (selectors, head elements order, attribute inspection)
without external dependencies like BeautifulSoup or lxml.
"""
from __future__ import annotations

from html.parser import HTMLParser
import re
from typing import Any, Dict, List, Optional, Tuple, Union

VOID_TAGS = {
    "area",
    "base",
    "br",
    "col",
    "embed",
    "hr",
    "img",
    "input",
    "link",
    "meta",
    "param",
    "source",
    "track",
    "wbr",
}


class DOMNode:
    """Lightweight representation of an HTML DOM element."""

    def __init__(
        self,
        tag: str,
        attrs: dict[str, str] | None = None,
        parent: DOMNode | None = None,
        line: int = 1,
    ):
        self.tag = tag.lower()
        self.attrs: dict[str, str] = attrs or {}
        self.parent = parent
        self.children: list[DOMNode] = []
        self.text_parts: list[str] = []
        self.line = line

    @property
    def text(self) -> str:
        """Return combined inner text of this node and all descendants."""
        res = list(self.text_parts)
        for child in self.children:
            res.append(child.text)
        return "".join(res)

    def get_attribute(self, name: str, default: str | None = None) -> str | None:
        """Get attribute value case-insensitively."""
        name_lower = name.lower()
        for k, v in self.attrs.items():
            if k.lower() == name_lower:
                return v
        return default

    def has_class(self, class_name: str) -> bool:
        """Check if node has the specified class."""
        classes = self.get_attribute("class", "").split()
        return class_name in classes

    def __repr__(self) -> str:
        attrs_str = " ".join(f'{k}="{v}"' for k, v in list(self.attrs.items())[:3])
        return f"<{self.tag} {attrs_str} (line {self.line})>"


class _DOMBuilderParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root_nodes: list[DOMNode] = []
        self.current_node: DOMNode | None = None

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]):
        tag_lower = tag.lower()
        attrs_dict = {k.lower(): (v if v is not None else "") for k, v in attrs}
        node = DOMNode(
            tag=tag_lower,
            attrs=attrs_dict,
            parent=self.current_node,
            line=self.getpos()[0],
        )

        if self.current_node is not None:
            self.current_node.children.append(node)
        else:
            self.root_nodes.append(node)

        if tag_lower not in VOID_TAGS:
            self.current_node = node

    def handle_endtag(self, tag: str):
        tag_lower = tag.lower()
        if tag_lower in VOID_TAGS:
            return

        curr = self.current_node
        while curr is not None:
            if curr.tag == tag_lower:
                self.current_node = curr.parent
                break
            curr = curr.parent

    def handle_data(self, data: str):
        if self.current_node is not None:
            self.current_node.text_parts.append(data)


def parse_html(html_text: str) -> list[DOMNode]:
    """Parse HTML text and return list of top-level DOMNode objects."""
    parser = _DOMBuilderParser()
    parser.feed(html_text)
    return parser.root_nodes


class _HeadElementCollector(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.in_head = False
        self.head_depth = 0
        self.elements: list[tuple[str, dict[str, str], int]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]):
        tag_lower = tag.lower()
        attrs_dict = {k.lower(): (v if v is not None else "") for k, v in attrs}

        if tag_lower == "head":
            self.in_head = True
            self.head_depth = 1
            return

        if self.in_head:
            self.elements.append((tag_lower, attrs_dict, self.getpos()[0]))
            if tag_lower not in VOID_TAGS:
                self.head_depth += 1

    def handle_endtag(self, tag: str):
        tag_lower = tag.lower()
        if tag_lower == "head":
            self.in_head = False
            self.head_depth = 0
            return

        if self.in_head and tag_lower not in VOID_TAGS:
            self.head_depth = max(1, self.head_depth - 1)


def get_head_elements_ordered(html_text: str) -> list[tuple[str, dict[str, str], int]]:
    """Extract all elements within <head> in document order.

    Returns: [(tag_name, attributes_dict, line_number), ...]
    """
    collector = _HeadElementCollector()
    collector.feed(html_text)
    return collector.elements


def _node_matches_simple(node: DOMNode, selector: str) -> bool:
    """Check if a single DOMNode matches a simple CSS selector."""
    s = selector.strip()
    if not s:
        return False

    # Check attribute selector: e.g. [attr], [attr="val"], tag[attr="val"]
    attr_match = re.match(r"^([a-zA-Z0-9_-]*)\[([a-zA-Z0-9_-]+)(?:=[\"']?(.*?)[\"']?)?\]$", s)
    if attr_match:
        tag_part, attr_name, attr_val = attr_match.groups()
        if tag_part and node.tag != tag_part.lower():
            return False
        if attr_name.lower() not in node.attrs:
            return False
        if attr_val is not None and node.attrs[attr_name.lower()] != attr_val:
            return False
        return True

    # Check ID selector: #foo or tag#foo
    if "#" in s:
        parts = s.split("#", 1)
        tag_part = parts[0].strip()
        id_part = parts[1].strip()
        if tag_part and node.tag != tag_part.lower():
            return False
        return node.get_attribute("id") == id_part

    # Check class selector: .foo or tag.foo
    if "." in s:
        parts = s.split(".", 1)
        tag_part = parts[0].strip()
        class_part = parts[1].strip()
        if tag_part and node.tag != tag_part.lower():
            return False
        return node.has_class(class_part)

    # Bare tag name
    return node.tag == s.lower()


def find_by_selector(nodes: Union[List[DOMNode], DOMNode], selector: str) -> list[DOMNode]:
    """Find all DOMNodes matching a CSS selector (supports descendant combinators)."""
    if isinstance(nodes, DOMNode):
        root_list = [nodes]
    else:
        root_list = nodes

    # Flatten tree to traverse
    def walk(n: DOMNode) -> list[DOMNode]:
        res = [n]
        for c in n.children:
            res.extend(walk(c))
        return res

    all_nodes: list[DOMNode] = []
    for r in root_list:
        all_nodes.extend(walk(r))

    # Split selector by spaces for descendant combinators
    parts = selector.strip().split()
    if len(parts) == 1:
        return [n for n in all_nodes if _node_matches_simple(n, parts[0])]

    # Descendant search
    candidates = [n for n in all_nodes if _node_matches_simple(n, parts[0])]
    for part in parts[1:]:
        next_candidates: list[DOMNode] = []
        for c in candidates:
            # find descendants of c matching part
            descendants = []
            for child in c.children:
                descendants.extend(walk(child))
            for d in descendants:
                if _node_matches_simple(d, part) and d not in next_candidates:
                    next_candidates.append(d)
        candidates = next_candidates

    return candidates


def has_attribute(node: DOMNode, attr_name: str, expected_val: str | None = None) -> bool:
    """Check if node contains attribute, optionally asserting its value."""
    val = node.get_attribute(attr_name)
    if val is None:
        return False
    if expected_val is not None:
        return val == expected_val
    return True
