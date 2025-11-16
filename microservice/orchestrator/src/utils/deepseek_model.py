# src/utils/deepseek_model.py
from typing import Any, Dict
from langchain_openai import ChatOpenAI


class DeepSeekChatOpenAI(ChatOpenAI):
    """
    ChatOpenAI wrapper dành riêng cho DeepSeek.

    DeepSeek hiện không chấp nhận message.content dạng list (multi-part)
    hoặc null, mà đòi hỏi content là string. Wrapper này sẽ:
      - Convert list content -> string
      - Convert None -> ""
    trước khi gửi request.
    """

    def _get_request_payload(
        self,
        input_: Any,
        *,
        stop: Any = None,
        **kwargs: Any,
    ) -> Dict[str, Any]:
        # Gọi logic gốc của ChatOpenAI để build payload
        payload = super()._get_request_payload(input_, stop=stop, **kwargs)

        fixed_messages = []
        for m in payload.get("messages", []):
            content = m.get("content")

            # 1) Nếu content là list (multi-part), join các text-part lại
            if isinstance(content, list):
                texts = []
                for part in content:
                    # format kiểu mới: {"type": "text", "text": "..."}
                    if isinstance(part, dict) and part.get("type") == "text":
                        texts.append(part.get("text", ""))
                    else:
                        # fallback: cast sang chuỗi
                        texts.append(str(part))
                m["content"] = "\n".join(t for t in texts if t)

            # 2) Nếu content là None (thường khi có tool_calls), DeepSeek muốn string
            elif content is None:
                m["content"] = ""

            fixed_messages.append(m)

        payload["messages"] = fixed_messages
        return payload
