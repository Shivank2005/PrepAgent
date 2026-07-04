import json, re

def robust_parse_json(content: str, default: any) -> any:
    try:
        cleaned = re.sub(r"`(?:json)?|`", "", content).strip()
        return json.loads(cleaned)
    except Exception:
        pass
    
    try:
        start_dict = content.find("{")
        start_list = content.find("[")
        if start_dict != -1 and start_list != -1:
            start = min(start_dict, start_list)
        else:
            start = max(start_dict, start_list)
            
        end_dict = content.rfind("}")
        end_list = content.rfind("]")
        end = max(end_dict, end_list)
        
        if start != -1 and end != -1:
            return json.loads(content[start:end+1])
    except Exception:
        pass
        
    return default

print(robust_parse_json('`json\n[\n  { "id": "q1" }\n]\n`', []))
