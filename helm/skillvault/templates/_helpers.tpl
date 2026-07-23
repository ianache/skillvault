{{/*
Expand the name of the chart.
*/}}
{{- define "skillvault.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "skillvault.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Chart label
*/}}
{{- define "skillvault.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "skillvault.labels" -}}
helm.sh/chart: {{ include "skillvault.chart" . }}
{{ include "skillvault.selectorLabels" . }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "skillvault.selectorLabels" -}}
app.kubernetes.io/name: {{ include "skillvault.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
MySQL fullname
*/}}
{{- define "skillvault.mysql.fullname" -}}
{{- printf "%s-mysql" (include "skillvault.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
DATABASE_URL — resuelve según mysql.enabled
*/}}
{{- define "skillvault.databaseUrl" -}}
{{- if .Values.mysql.enabled }}
{{- printf "mysql://%s:%s@%s:3306/%s" .Values.mysql.auth.username .Values.mysql.auth.password (include "skillvault.mysql.fullname" .) .Values.mysql.auth.database }}
{{- else }}
{{- required "Cuando mysql.enabled=false debes definir externalDatabaseUrl" .Values.externalDatabaseUrl }}
{{- end }}
{{- end }}

{{/*
MySQL selector labels
*/}}
{{- define "skillvault.mysql.selectorLabels" -}}
app.kubernetes.io/name: {{ include "skillvault.name" . }}-mysql
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
