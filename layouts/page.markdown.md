---
{{- with .OutputFormats.Get "html" }}
url: {{ .Permalink }}
{{- end }}
{{- with .Description }}
description: {{ . | jsonify }}
{{- end }}
{{- if not .Lastmod.IsZero }}
last_updated: {{ .Lastmod.Format "2006-01-02T15:04:05Z07:00" }}
{{- end }}
---

# {{ .Title }}

{{ partial "markdown-body" . }}
