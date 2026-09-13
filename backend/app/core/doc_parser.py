import zlib
import re
from typing import Tuple


def extract_text_from_pdf(data: bytes) -> str:
    """
    Extracts readable text from PDF bytes using a lightweight, pure-Python stream decoder.
    Decodes FlateDecode streams and extracts BT ... ET text blocks without external dependencies.
    """
    text_chunks = []
    # Find all streams in the PDF
    stream_matches = re.finditer(rb"stream[\r\n]+(.*?)[\r\n]+endstream", data, re.DOTALL)
    for m in stream_matches:
        raw_stream = m.group(1)
        try:
            decompressed = zlib.decompress(raw_stream)
        except Exception:
            decompressed = raw_stream

        # Extract text blocks between BT and ET
        bt_blocks = re.findall(rb"BT(.*?)ET", decompressed, re.DOTALL)
        for block in bt_blocks:
            # Match text enclosed in parentheses: (sample text)
            strings = re.findall(rb"\((.*?)\)", block)
            for s in strings:
                try:
                    decoded = s.decode("utf-8", errors="ignore").strip()
                    if decoded:
                        text_chunks.append(decoded)
                except Exception:
                    pass

    if text_chunks:
        return " ".join(text_chunks)

    # Fallback: extract continuous printable ASCII chunks
    printable = re.findall(rb"[a-zA-Z0-9\s.,;:'\"!?\-$%&()]{4,}", data)
    ascii_chunks = [p.decode("ascii", errors="ignore").strip() for p in printable]
    return " ".join([c for c in ascii_chunks if len(c) > 3])


def parse_uploaded_document(filename: str, content: bytes) -> Tuple[str, str]:
    """
    Parses uploaded file content based on file extension.
    Returns (cleaned_text, doc_type).
    Truncates content to 25,000 characters to keep LLM context concise.
    """
    ext = filename.lower().split(".")[-1] if "." in filename else "txt"
    doc_type = ext

    if ext == "pdf":
        raw_text = extract_text_from_pdf(content)
        doc_type = "PDF Document"
    elif ext in ["json", "txt", "md", "csv", "tsv", "py", "yml", "yaml"]:
        try:
            raw_text = content.decode("utf-8")
        except UnicodeDecodeError:
            try:
                raw_text = content.decode("latin-1")
            except Exception:
                raw_text = content.decode("ascii", errors="ignore")
        doc_type = f"{ext.upper()} Text"
    else:
        # Generic text attempt
        try:
            raw_text = content.decode("utf-8", errors="ignore")
            doc_type = "Text File"
        except Exception:
            raw_text = ""
            doc_type = "Unknown"

    # Normalize whitespace and truncate
    normalized = re.sub(r"\s+", " ", raw_text).strip()
    if len(normalized) > 25000:
        normalized = normalized[:25000] + " ... [Content truncated for length]"

    return normalized, doc_type
