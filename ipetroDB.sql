--
-- PostgreSQL database dump
--

-- Dumped from database version 15.4
-- Dumped by pg_dump version 15.4

-- Started on 2026-01-14 21:30:21

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

DROP DATABASE IF EXISTS "IPetro";
--
-- TOC entry 3628 (class 1262 OID 32778)
-- Name: IPetro; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE "IPetro" WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'English_United States.1256';


ALTER DATABASE "IPetro" OWNER TO postgres;

\connect "IPetro"

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 247 (class 1255 OID 57467)
-- Name: update_findings_summary_timestamp(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_findings_summary_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_findings_summary_timestamp() OWNER TO postgres;

--
-- TOC entry 244 (class 1255 OID 40992)
-- Name: update_inspection_overdue(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_inspection_overdue() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.is_overdue := (NEW.due_date IS NOT NULL AND NEW.due_date < CURRENT_DATE AND NEW.status NOT IN ('approved', 'archived'));
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_inspection_overdue() OWNER TO postgres;

--
-- TOC entry 243 (class 1255 OID 32986)
-- Name: update_modified_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_modified_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_modified_column() OWNER TO postgres;

--
-- TOC entry 246 (class 1255 OID 41168)
-- Name: update_observation_overdue(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_observation_overdue() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NEW.due_date IS NOT NULL 
     AND NEW.due_date < CURRENT_DATE 
     AND NEW.follow_up_status NOT IN ('Completed', 'Cancelled') THEN
    NEW.follow_up_status = 'Overdue';
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_observation_overdue() OWNER TO postgres;

--
-- TOC entry 245 (class 1255 OID 41166)
-- Name: update_observation_timestamp(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_observation_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_observation_timestamp() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 233 (class 1259 OID 32966)
-- Name: activity_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.activity_logs (
    log_id integer NOT NULL,
    user_id integer,
    action character varying(100),
    entity character varying(50),
    entity_id integer,
    details jsonb,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.activity_logs OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 32965)
-- Name: activity_logs_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.activity_logs_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.activity_logs_log_id_seq OWNER TO postgres;

--
-- TOC entry 3629 (class 0 OID 0)
-- Dependencies: 232
-- Name: activity_logs_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.activity_logs_log_id_seq OWNED BY public.activity_logs.log_id;


--
-- TOC entry 240 (class 1259 OID 57393)
-- Name: ai_report_analysis; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ai_report_analysis (
    analysis_id integer NOT NULL,
    inspection_id integer NOT NULL,
    overall_score integer NOT NULL,
    grade character varying(2),
    breakdown jsonb NOT NULL,
    strengths text[],
    improvements text[],
    overall_comment text,
    analyzed_by integer,
    analyzed_at timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now(),
    analysis_type character varying(20) DEFAULT 'rubric'::character varying,
    CONSTRAINT ai_report_analysis_analysis_type_check CHECK (((analysis_type)::text = ANY ((ARRAY['rubric'::character varying, 'api_510'::character varying, 'combined'::character varying])::text[]))),
    CONSTRAINT chk_analysis_type CHECK (((analysis_type)::text = ANY ((ARRAY['rubric'::character varying, 'api_510'::character varying, 'combined'::character varying])::text[]))),
    CONSTRAINT score_range CHECK (((overall_score >= 0) AND (overall_score <= 100)))
);


ALTER TABLE public.ai_report_analysis OWNER TO postgres;

--
-- TOC entry 3630 (class 0 OID 0)
-- Dependencies: 240
-- Name: COLUMN ai_report_analysis.analysis_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.ai_report_analysis.analysis_type IS 'Type of analysis performed: rubric (quality-based), api_510 (compliance-based), or combined (both)';


--
-- TOC entry 239 (class 1259 OID 57392)
-- Name: ai_report_analysis_analysis_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ai_report_analysis_analysis_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.ai_report_analysis_analysis_id_seq OWNER TO postgres;

--
-- TOC entry 3631 (class 0 OID 0)
-- Dependencies: 239
-- Name: ai_report_analysis_analysis_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ai_report_analysis_analysis_id_seq OWNED BY public.ai_report_analysis.analysis_id;


--
-- TOC entry 236 (class 1259 OID 41182)
-- Name: finding_templates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.finding_templates (
    template_id integer NOT NULL,
    observation_type character varying(50) NOT NULL,
    severity character varying(20) NOT NULL,
    template_text text NOT NULL,
    is_active boolean DEFAULT true,
    created_by integer,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.finding_templates OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 41181)
-- Name: finding_templates_template_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.finding_templates_template_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.finding_templates_template_id_seq OWNER TO postgres;

--
-- TOC entry 3632 (class 0 OID 0)
-- Dependencies: 235
-- Name: finding_templates_template_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.finding_templates_template_id_seq OWNED BY public.finding_templates.template_id;


--
-- TOC entry 242 (class 1259 OID 57434)
-- Name: findings_summary; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.findings_summary (
    summary_id integer NOT NULL,
    inspection_id integer NOT NULL,
    vessel_id integer NOT NULL,
    initial_inspection text DEFAULT 'Not applicable'::text,
    post_inspection text,
    external_findings jsonb DEFAULT '[]'::jsonb,
    internal_findings jsonb DEFAULT '[]'::jsonb,
    ndt_testings text,
    recommendations jsonb DEFAULT '[]'::jsonb,
    created_by integer,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.findings_summary OWNER TO postgres;

--
-- TOC entry 241 (class 1259 OID 57433)
-- Name: findings_summary_summary_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.findings_summary_summary_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.findings_summary_summary_id_seq OWNER TO postgres;

--
-- TOC entry 3633 (class 0 OID 0)
-- Dependencies: 241
-- Name: findings_summary_summary_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.findings_summary_summary_id_seq OWNED BY public.findings_summary.summary_id;


--
-- TOC entry 219 (class 1259 OID 32808)
-- Name: inspections; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inspections (
    inspection_id integer NOT NULL,
    vessel_id integer,
    inspector_id integer,
    reviewer_id integer,
    status character varying(20) DEFAULT 'draft'::character varying,
    inspection_date date,
    remarks text,
    version integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    inspection_type character varying(50),
    priority character varying(20) DEFAULT 'Medium'::character varying,
    scheduled_date date,
    due_date date,
    completed_date date,
    duration_hours numeric(5,2),
    weather_conditions jsonb,
    checklist_data jsonb,
    defects_summary jsonb,
    recommendations jsonb,
    previous_inspection_id integer,
    is_overdue boolean DEFAULT false,
    report_number character varying(100),
    report_generated_at timestamp without time zone,
    report_generated_by integer,
    report_file_url text,
    next_inspection_date date,
    findings_summary text,
    report_status character varying(50) DEFAULT 'pending'::character varying,
    report_reviewed_by integer,
    report_reviewed_at timestamp without time zone,
    report_review_comments text,
    last_ai_analysis_id integer,
    dosh_registration character varying(100),
    CONSTRAINT inspections_priority_check CHECK (((priority)::text = ANY ((ARRAY['Critical'::character varying, 'High'::character varying, 'Medium'::character varying, 'Low'::character varying])::text[]))),
    CONSTRAINT inspections_status_check CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'submitted'::character varying, 'under_review'::character varying, 'changes_requested'::character varying, 'approved'::character varying, 'archived'::character varying])::text[]))),
    CONSTRAINT inspections_type_check CHECK (((inspection_type)::text = ANY ((ARRAY['Initial'::character varying, 'Periodic'::character varying, 'Emergency'::character varying, 'Pre-Shutdown'::character varying, 'Post-Repair'::character varying])::text[])))
);


ALTER TABLE public.inspections OWNER TO postgres;

--
-- TOC entry 3634 (class 0 OID 0)
-- Dependencies: 219
-- Name: COLUMN inspections.report_number; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.inspections.report_number IS 'Generated report number (e.g., PLANT1/VI/V-001/TA2025)';


--
-- TOC entry 3635 (class 0 OID 0)
-- Dependencies: 219
-- Name: COLUMN inspections.report_generated_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.inspections.report_generated_at IS 'Timestamp when report was generated';


--
-- TOC entry 3636 (class 0 OID 0)
-- Dependencies: 219
-- Name: COLUMN inspections.report_file_url; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.inspections.report_file_url IS 'URL to stored PDF report';


--
-- TOC entry 3637 (class 0 OID 0)
-- Dependencies: 219
-- Name: COLUMN inspections.dosh_registration; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.inspections.dosh_registration IS 'DOSH registration number for this inspection';


--
-- TOC entry 218 (class 1259 OID 32807)
-- Name: inspections_inspection_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.inspections_inspection_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.inspections_inspection_id_seq OWNER TO postgres;

--
-- TOC entry 3638 (class 0 OID 0)
-- Dependencies: 218
-- Name: inspections_inspection_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.inspections_inspection_id_seq OWNED BY public.inspections.inspection_id;


--
-- TOC entry 234 (class 1259 OID 41137)
-- Name: observation_photos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.observation_photos (
    observation_id integer NOT NULL,
    photo_id integer NOT NULL,
    sequence_order integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.observation_photos OWNER TO postgres;

--
-- TOC entry 3639 (class 0 OID 0)
-- Dependencies: 234
-- Name: TABLE observation_photos; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.observation_photos IS 'Links observations to photos';


--
-- TOC entry 223 (class 1259 OID 32857)
-- Name: observations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.observations (
    observation_id integer NOT NULL,
    inspection_id integer,
    component character varying(100),
    description text,
    recommendation text,
    severity character varying(20),
    created_by integer,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    observation_type character varying(50),
    vessel_id integer,
    location text,
    finding_number character varying(20),
    acceptance_criteria text,
    standard_reference character varying(100),
    measurement_data jsonb,
    status character varying(50) DEFAULT 'Open'::character varying,
    action_required character varying(100),
    priority character varying(20) DEFAULT 'Medium'::character varying,
    due_date date,
    follow_up_status character varying(50) DEFAULT 'Pending'::character varying,
    follow_up_inspection_id integer,
    previous_observation_id integer,
    reviewed_by integer,
    section character varying(20) DEFAULT 'Internal'::character varying,
    CONSTRAINT check_section_value CHECK (((section)::text = ANY ((ARRAY['External'::character varying, 'Internal'::character varying])::text[]))),
    CONSTRAINT observations_action_check CHECK (((action_required)::text = ANY ((ARRAY['No Action'::character varying, 'Monitor'::character varying, 'Repair'::character varying, 'Replace'::character varying, 'Further Investigation'::character varying, 'Immediate Action'::character varying])::text[]))),
    CONSTRAINT observations_followup_check CHECK (((follow_up_status)::text = ANY ((ARRAY['Pending'::character varying, 'In Progress'::character varying, 'Completed'::character varying, 'Cancelled'::character varying, 'Overdue'::character varying])::text[]))),
    CONSTRAINT observations_priority_check CHECK (((priority)::text = ANY ((ARRAY['Low'::character varying, 'Medium'::character varying, 'High'::character varying, 'Critical'::character varying])::text[]))),
    CONSTRAINT observations_severity_check CHECK (((severity)::text = ANY ((ARRAY['Minor'::character varying, 'Moderate'::character varying, 'Major'::character varying, 'Critical'::character varying])::text[]))),
    CONSTRAINT observations_status_check CHECK (((status)::text = ANY ((ARRAY['Open'::character varying, 'Acceptable'::character varying, 'Monitoring Required'::character varying, 'Repair Required'::character varying, 'Closed'::character varying])::text[]))),
    CONSTRAINT observations_type_check CHECK (((observation_type)::text = ANY ((ARRAY['Corrosion'::character varying, 'Erosion'::character varying, 'Cracking'::character varying, 'Deformation'::character varying, 'Mechanical Damage'::character varying, 'Weld Defect'::character varying, 'Coating Damage'::character varying, 'Pitting'::character varying, 'Leakage'::character varying, 'Structural Issue'::character varying, 'General Wear'::character varying, 'Other'::character varying])::text[])))
);


ALTER TABLE public.observations OWNER TO postgres;

--
-- TOC entry 3640 (class 0 OID 0)
-- Dependencies: 223
-- Name: TABLE observations; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.observations IS 'Inspection findings, defects, and observations';


--
-- TOC entry 3641 (class 0 OID 0)
-- Dependencies: 223
-- Name: COLUMN observations.component; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.observations.component IS 'Equipment component where observation was made';


--
-- TOC entry 3642 (class 0 OID 0)
-- Dependencies: 223
-- Name: COLUMN observations.severity; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.observations.severity IS 'Severity level of the observation';


--
-- TOC entry 3643 (class 0 OID 0)
-- Dependencies: 223
-- Name: COLUMN observations.observation_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.observations.observation_type IS 'Type of defect or finding';


--
-- TOC entry 3644 (class 0 OID 0)
-- Dependencies: 223
-- Name: COLUMN observations.location; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.observations.location IS 'Specific location description (e.g., "4 o''clock position")';


--
-- TOC entry 3645 (class 0 OID 0)
-- Dependencies: 223
-- Name: COLUMN observations.finding_number; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.observations.finding_number IS 'Reference number from inspection report (e.g., 2.1, 2.2)';


--
-- TOC entry 3646 (class 0 OID 0)
-- Dependencies: 223
-- Name: COLUMN observations.acceptance_criteria; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.observations.acceptance_criteria IS 'Standards or criteria used for assessment';


--
-- TOC entry 3647 (class 0 OID 0)
-- Dependencies: 223
-- Name: COLUMN observations.measurement_data; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.observations.measurement_data IS 'JSON data for measurements (depth, length, width, etc.)';


--
-- TOC entry 3648 (class 0 OID 0)
-- Dependencies: 223
-- Name: COLUMN observations.status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.observations.status IS 'Current status of the observation';


--
-- TOC entry 3649 (class 0 OID 0)
-- Dependencies: 223
-- Name: COLUMN observations.action_required; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.observations.action_required IS 'Required action based on findings';


--
-- TOC entry 3650 (class 0 OID 0)
-- Dependencies: 223
-- Name: COLUMN observations.follow_up_status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.observations.follow_up_status IS 'Status of follow-up actions';


--
-- TOC entry 3651 (class 0 OID 0)
-- Dependencies: 223
-- Name: COLUMN observations.previous_observation_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.observations.previous_observation_id IS 'Link to previous observation for tracking progression';


--
-- TOC entry 222 (class 1259 OID 32856)
-- Name: observations_observation_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.observations_observation_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.observations_observation_id_seq OWNER TO postgres;

--
-- TOC entry 3652 (class 0 OID 0)
-- Dependencies: 222
-- Name: observations_observation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.observations_observation_id_seq OWNED BY public.observations.observation_id;


--
-- TOC entry 221 (class 1259 OID 32837)
-- Name: photos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.photos (
    photo_id integer NOT NULL,
    inspection_id integer,
    file_uri text NOT NULL,
    tag_number character varying(50),
    component character varying(100),
    caption text,
    uploaded_by integer,
    sequence_no integer DEFAULT 1,
    metadata jsonb,
    uploaded_at timestamp without time zone DEFAULT now(),
    object_key text,
    file_size integer,
    mime_type character varying(100),
    original_filename character varying(255),
    component_category character varying(100),
    photo_group character varying(20),
    updated_at timestamp without time zone DEFAULT now(),
    name character varying(255),
    has_annotations boolean DEFAULT false,
    CONSTRAINT photos_component_check CHECK (((component)::text = ANY ((ARRAY['General View'::character varying, 'Nameplate'::character varying, 'Foundation'::character varying, 'Support'::character varying, 'Shell External'::character varying, 'Shell Internal'::character varying, 'Bottom Head External'::character varying, 'Bottom Head Internal'::character varying, 'Top Head External'::character varying, 'Top Head Internal'::character varying, 'Nozzle'::character varying, 'Manhole'::character varying, 'Flange'::character varying, 'Gasket'::character varying, 'Weldment'::character varying, 'Attachment'::character varying, 'Insulation'::character varying, 'Coating'::character varying, 'Corrosion'::character varying, 'Defect'::character varying, 'Measurement'::character varying, 'Other'::character varying])::text[])))
);


ALTER TABLE public.photos OWNER TO postgres;

--
-- TOC entry 3653 (class 0 OID 0)
-- Dependencies: 221
-- Name: TABLE photos; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.photos IS 'Stores inspection photos with metadata';


--
-- TOC entry 3654 (class 0 OID 0)
-- Dependencies: 221
-- Name: COLUMN photos.file_uri; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.photos.file_uri IS 'Relative path to photo file (e.g., /uploads/photos/filename.jpg)';


--
-- TOC entry 3655 (class 0 OID 0)
-- Dependencies: 221
-- Name: COLUMN photos.tag_number; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.photos.tag_number IS 'Photo group number (e.g., "1", "2", "3")';


--
-- TOC entry 3656 (class 0 OID 0)
-- Dependencies: 221
-- Name: COLUMN photos.component; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.photos.component IS 'Component type being photographed';


--
-- TOC entry 3657 (class 0 OID 0)
-- Dependencies: 221
-- Name: COLUMN photos.sequence_no; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.photos.sequence_no IS 'Photo sequence within group (e.g., 1, 2, 3 for photos 1.1, 1.2, 1.3)';


--
-- TOC entry 3658 (class 0 OID 0)
-- Dependencies: 221
-- Name: COLUMN photos.original_filename; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.photos.original_filename IS 'Original filename from user upload';


--
-- TOC entry 3659 (class 0 OID 0)
-- Dependencies: 221
-- Name: COLUMN photos.component_category; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.photos.component_category IS 'General category for grouping';


--
-- TOC entry 3660 (class 0 OID 0)
-- Dependencies: 221
-- Name: COLUMN photos.name; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.photos.name IS 'Stored filename on server';


--
-- TOC entry 220 (class 1259 OID 32836)
-- Name: photos_photo_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.photos_photo_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.photos_photo_id_seq OWNER TO postgres;

--
-- TOC entry 3661 (class 0 OID 0)
-- Dependencies: 220
-- Name: photos_photo_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.photos_photo_id_seq OWNED BY public.photos.photo_id;


--
-- TOC entry 225 (class 1259 OID 32884)
-- Name: presets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.presets (
    preset_id integer NOT NULL,
    category character varying(50),
    preset_text text NOT NULL,
    type character varying(20),
    placeholders jsonb,
    severity_hint character varying(20),
    active boolean DEFAULT true,
    created_by integer,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT presets_type_check CHECK (((type)::text = ANY ((ARRAY['finding'::character varying, 'recommendation'::character varying])::text[])))
);


ALTER TABLE public.presets OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 32883)
-- Name: presets_preset_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.presets_preset_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.presets_preset_id_seq OWNER TO postgres;

--
-- TOC entry 3662 (class 0 OID 0)
-- Dependencies: 224
-- Name: presets_preset_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.presets_preset_id_seq OWNED BY public.presets.preset_id;


--
-- TOC entry 238 (class 1259 OID 41198)
-- Name: recommendation_templates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.recommendation_templates (
    template_id integer NOT NULL,
    action_required character varying(100) NOT NULL,
    priority character varying(20) NOT NULL,
    template_text text NOT NULL,
    is_active boolean DEFAULT true,
    created_by integer,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.recommendation_templates OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 41197)
-- Name: recommendation_templates_template_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.recommendation_templates_template_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.recommendation_templates_template_id_seq OWNER TO postgres;

--
-- TOC entry 3663 (class 0 OID 0)
-- Dependencies: 237
-- Name: recommendation_templates_template_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.recommendation_templates_template_id_seq OWNED BY public.recommendation_templates.template_id;


--
-- TOC entry 229 (class 1259 OID 32918)
-- Name: reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reports (
    report_id integer NOT NULL,
    inspection_id integer,
    template_id integer,
    file_url text NOT NULL,
    generated_by integer,
    status character varying(20) DEFAULT 'draft'::character varying,
    generated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT reports_status_check CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'final'::character varying, 'locked'::character varying])::text[])))
);


ALTER TABLE public.reports OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 32917)
-- Name: reports_report_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.reports_report_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.reports_report_id_seq OWNER TO postgres;

--
-- TOC entry 3664 (class 0 OID 0)
-- Dependencies: 228
-- Name: reports_report_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.reports_report_id_seq OWNED BY public.reports.report_id;


--
-- TOC entry 231 (class 1259 OID 32945)
-- Name: reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reviews (
    review_id integer NOT NULL,
    inspection_id integer,
    reviewer_id integer,
    comments text,
    status character varying(20),
    reviewed_at timestamp without time zone DEFAULT now(),
    CONSTRAINT reviews_status_check CHECK (((status)::text = ANY ((ARRAY['approved'::character varying, 'rejected'::character varying, 'changes_requested'::character varying])::text[])))
);


ALTER TABLE public.reviews OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 32944)
-- Name: reviews_review_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.reviews_review_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.reviews_review_id_seq OWNER TO postgres;

--
-- TOC entry 3665 (class 0 OID 0)
-- Dependencies: 230
-- Name: reviews_review_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.reviews_review_id_seq OWNED BY public.reviews.review_id;


--
-- TOC entry 227 (class 1259 OID 32901)
-- Name: templates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.templates (
    template_id integer NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    template_html text,
    version integer DEFAULT 1,
    active boolean DEFAULT true,
    created_by integer,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.templates OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 32900)
-- Name: templates_template_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.templates_template_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.templates_template_id_seq OWNER TO postgres;

--
-- TOC entry 3666 (class 0 OID 0)
-- Dependencies: 226
-- Name: templates_template_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.templates_template_id_seq OWNED BY public.templates.template_id;


--
-- TOC entry 215 (class 1259 OID 32780)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    user_id integer NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(100) NOT NULL,
    password_hash text NOT NULL,
    role character varying(20) NOT NULL,
    department character varying(100),
    certification_id character varying(50),
    active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    username character varying(50) NOT NULL,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['inspector'::character varying, 'reviewer'::character varying, 'admin'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 214 (class 1259 OID 32779)
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_user_id_seq OWNER TO postgres;

--
-- TOC entry 3667 (class 0 OID 0)
-- Dependencies: 214
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- TOC entry 217 (class 1259 OID 32795)
-- Name: vessels; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vessels (
    vessel_id integer NOT NULL,
    tag_no character varying(50) NOT NULL,
    description text,
    plant_unit character varying(100),
    location character varying(100),
    design_data jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    vessel_type character varying(50),
    plant_identifier character varying(20) DEFAULT '1'::character varying,
    CONSTRAINT vessels_type_check CHECK (((vessel_type)::text = ANY ((ARRAY['Column/Tower'::character varying, 'Reactor'::character varying, 'Condenser'::character varying, 'Bullet'::character varying, 'Sphere'::character varying, 'Accumulator'::character varying, 'Heat Exchanger'::character varying, 'Separator'::character varying])::text[])))
);


ALTER TABLE public.vessels OWNER TO postgres;

--
-- TOC entry 3668 (class 0 OID 0)
-- Dependencies: 217
-- Name: COLUMN vessels.plant_identifier; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.vessels.plant_identifier IS 'Plant identifier for report numbering (e.g., 1, 2, A, B)';


--
-- TOC entry 216 (class 1259 OID 32794)
-- Name: vessels_vessel_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.vessels_vessel_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.vessels_vessel_id_seq OWNER TO postgres;

--
-- TOC entry 3669 (class 0 OID 0)
-- Dependencies: 216
-- Name: vessels_vessel_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.vessels_vessel_id_seq OWNED BY public.vessels.vessel_id;


--
-- TOC entry 3287 (class 2604 OID 32969)
-- Name: activity_logs log_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs ALTER COLUMN log_id SET DEFAULT nextval('public.activity_logs_log_id_seq'::regclass);


--
-- TOC entry 3297 (class 2604 OID 57396)
-- Name: ai_report_analysis analysis_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_report_analysis ALTER COLUMN analysis_id SET DEFAULT nextval('public.ai_report_analysis_analysis_id_seq'::regclass);


--
-- TOC entry 3291 (class 2604 OID 41185)
-- Name: finding_templates template_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.finding_templates ALTER COLUMN template_id SET DEFAULT nextval('public.finding_templates_template_id_seq'::regclass);


--
-- TOC entry 3301 (class 2604 OID 57437)
-- Name: findings_summary summary_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.findings_summary ALTER COLUMN summary_id SET DEFAULT nextval('public.findings_summary_summary_id_seq'::regclass);


--
-- TOC entry 3255 (class 2604 OID 32811)
-- Name: inspections inspection_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspections ALTER COLUMN inspection_id SET DEFAULT nextval('public.inspections_inspection_id_seq'::regclass);


--
-- TOC entry 3268 (class 2604 OID 32860)
-- Name: observations observation_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.observations ALTER COLUMN observation_id SET DEFAULT nextval('public.observations_observation_id_seq'::regclass);


--
-- TOC entry 3263 (class 2604 OID 32840)
-- Name: photos photo_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.photos ALTER COLUMN photo_id SET DEFAULT nextval('public.photos_photo_id_seq'::regclass);


--
-- TOC entry 3275 (class 2604 OID 32887)
-- Name: presets preset_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.presets ALTER COLUMN preset_id SET DEFAULT nextval('public.presets_preset_id_seq'::regclass);


--
-- TOC entry 3294 (class 2604 OID 41201)
-- Name: recommendation_templates template_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recommendation_templates ALTER COLUMN template_id SET DEFAULT nextval('public.recommendation_templates_template_id_seq'::regclass);


--
-- TOC entry 3282 (class 2604 OID 32921)
-- Name: reports report_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports ALTER COLUMN report_id SET DEFAULT nextval('public.reports_report_id_seq'::regclass);


--
-- TOC entry 3285 (class 2604 OID 32948)
-- Name: reviews review_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews ALTER COLUMN review_id SET DEFAULT nextval('public.reviews_review_id_seq'::regclass);


--
-- TOC entry 3278 (class 2604 OID 32904)
-- Name: templates template_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.templates ALTER COLUMN template_id SET DEFAULT nextval('public.templates_template_id_seq'::regclass);


--
-- TOC entry 3247 (class 2604 OID 32783)
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- TOC entry 3251 (class 2604 OID 32798)
-- Name: vessels vessel_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vessels ALTER COLUMN vessel_id SET DEFAULT nextval('public.vessels_vessel_id_seq'::regclass);


--
-- TOC entry 3613 (class 0 OID 32966)
-- Dependencies: 233
-- Data for Name: activity_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.activity_logs VALUES (1, 1, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2025-11-15T10:50:07.663Z", "login_method": "username"}', '2025-11-15 13:50:07.664481') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (2, 1, 'password_change', 'user', NULL, '{"timestamp": "2025-11-15T11:04:11.915Z"}', '2025-11-15 14:04:11.915839') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (3, 1, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2025-11-16T07:21:22.899Z", "login_method": "username"}', '2025-11-16 10:21:22.901601') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (4, 1, 'create_user', 'user', 2, '{"role": "inspector", "email": "mohammedali@ipetro.com", "username": "inspector01", "created_user": "Mohammed Ali"}', '2025-11-16 13:36:37.654972') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (5, 1, 'create_user', 'user', 3, '{"role": "reviewer", "email": "fahad@ipetro.com", "username": "reviewer01", "created_user": "Fahad Khalid"}', '2025-11-16 13:38:25.601237') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (6, 1, 'create_user', 'user', 4, '{"role": "admin", "email": "faisal@ipetro.com", "username": "admin2", "created_user": "Faisal Ahmed"}', '2025-11-16 13:39:48.331416') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (7, 1, 'update_user', 'user', 2, '{"name": "Mohammed Ali Al-Selwi", "department": "Field Operations - Senior Team", "certification_id": "API-510-12345-UPDATED"}', '2025-11-16 13:46:36.473456') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (8, 1, 'reset_password', 'user', 2, '{"target_user": "Mohammed Ali Al-Selwi"}', '2025-11-16 13:49:21.144057') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (9, 1, 'delete_user', 'user', 2, '{"deleted_user": "Mohammed Ali Al-Selwi"}', '2025-11-16 13:50:26.365578') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (10, 1, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2025-11-17T04:25:59.730Z", "login_method": "username"}', '2025-11-17 07:25:59.731239') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (11, 1, 'create_vessel', 'vessel', 1, '{"tag_no": "V-101", "vessel_type": "Column/Tower"}', '2025-11-17 07:29:25.942142') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (12, 1, 'create_vessel', 'vessel', 2, '{"tag_no": "R-201", "vessel_type": "Reactor"}', '2025-11-17 07:30:09.280746') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (13, 1, 'create_vessel', 'vessel', 3, '{"tag_no": "HX-301", "vessel_type": "Heat Exchanger"}', '2025-11-17 07:30:20.681647') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (14, 1, 'create_vessel', 'vessel', 4, '{"tag_no": "S-401", "vessel_type": "Sphere"}', '2025-11-17 07:30:42.401045') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (15, 1, 'update_vessel', 'vessel', 1, '{"location": "Area A - Block 1 - Updated Location", "description": "Main Distillation Column - Updated", "design_data": {"height": "75 ft", "diameter": "10 ft", "material": "Carbon Steel SA-516 Grade 70", "thickness": "0.5 inch", "design_pressure": "160 psi", "last_inspection": "2024-12-01", "design_temperature": "450°F"}}', '2025-11-17 09:14:12.278215') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (16, 1, 'delete_vessel', 'vessel', 1, '{"deleted_tag_no": "V-101", "deleted_vessel_type": "Column/Tower"}', '2025-11-17 09:19:01.956897') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (17, 1, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2025-11-19T01:56:44.331Z", "login_method": "username"}', '2025-11-19 04:56:44.332713') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (18, 1, 'create_user', 'user', 5, '{"role": "inspector", "email": "ahmed@ipetro.com", "username": "inspector02", "created_user": "Ahmed"}', '2025-11-19 05:05:43.575071') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (19, 5, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2025-11-19T02:07:10.372Z", "login_method": "username"}', '2025-11-19 05:07:10.373433') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (20, 5, 'create_inspection', 'inspection', 1, '{"priority": "High", "vessel_id": 2, "inspection_type": "Periodic"}', '2025-11-19 05:21:08.878871') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (21, 5, 'create_inspection', 'inspection', 2, '{"priority": "Critical", "vessel_id": 3, "inspection_type": "Emergency"}', '2025-11-19 05:22:14.153035') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (22, 5, 'upload_photos', 'photo', 1, '{"component": "General View", "photo_count": 1, "inspection_id": "1"}', '2025-11-19 06:28:48.068033') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (23, 5, 'upload_photos', 'photo', 1, '{"component": "Nameplate", "photo_count": 3, "inspection_id": "1"}', '2025-11-19 06:46:05.247845') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (24, 5, 'create_observation', 'observation', 2, '{"severity": "Minor", "component": "Manhole", "inspection_id": 1, "observation_type": "Mechanical Damage"}', '2025-11-19 08:38:48.140534') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (25, 5, 'create_observation', 'observation', 3, '{"severity": "Moderate", "component": "Manhole", "inspection_id": 1, "observation_type": "Deformation"}', '2025-11-19 08:39:55.420704') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (26, 5, 'create_observation', 'observation', 4, '{"severity": "Minor", "component": "Weldment", "inspection_id": 1, "observation_type": "Pitting"}', '2025-11-19 08:40:26.901233') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (27, 5, 'update_observation', 'observation', 2, '{"description": "Updated: Internal of manhole cover noted with evidence of mechanical mark on gasket seat area at 4 o''clock position. Mark dimensions approximately 10mm x 5mm.", "follow_up_status": "In Progress", "measurement_data": {"depth": "<0.5mm", "width": "5mm", "length": "10mm"}}', '2025-11-19 08:57:02.388579') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (28, 5, 'generate_report', 'inspection', 2, '{"filename": "HX-301_2_1763545210716.pdf", "report_number": "PLANT1/VI/HX-301/TA2025"}', '2025-11-19 12:40:10.792084') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (29, 1, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2025-11-20T05:35:37.303Z", "login_method": "username"}', '2025-11-20 08:35:37.307192') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (30, 1, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2025-11-20T05:59:44.982Z", "login_method": "username"}', '2025-11-20 08:59:44.983874') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (31, 5, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2025-11-20T06:02:25.141Z", "login_method": "username"}', '2025-11-20 09:02:25.142519') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (32, 1, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2025-11-20T10:21:40.556Z", "login_method": "email"}', '2025-11-20 13:21:40.557915') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (33, 1, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2025-11-20T10:23:02.799Z", "login_method": "email"}', '2025-11-20 13:23:02.800198') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (34, 5, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2025-11-20T11:12:54.451Z", "login_method": "username"}', '2025-11-20 14:12:54.453604') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (35, 1, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2025-11-20T12:14:10.770Z", "login_method": "email"}', '2025-11-20 15:14:10.77141') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (36, 1, 'create_vessel', 'vessel', 5, '{"tag_no": "V-001", "vessel_type": "Column/Tower"}', '2025-11-20 15:35:48.744167') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (37, 1, 'update_vessel', 'vessel', 5, '{"tag_no": "V-001", "location": "Area A - Block 2", "plant_unit": "Unit 1", "description": "Test Pressure Vessel", "design_data": {"material": "Carbon Steal", "year_built": "2014", "manufacturer": "Fabrication", "design_pressure": "150 psi", "design_temperature": "450F"}, "vessel_type": "Reactor"}', '2025-11-20 15:41:10.831666') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (38, 1, 'create_vessel', 'vessel', 6, '{"tag_no": "V-002", "vessel_type": "Reactor"}', '2025-11-20 19:09:11.21107') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (39, 1, 'delete_vessel', 'vessel', 6, '{"deleted_tag_no": "V-002", "deleted_vessel_type": "Reactor"}', '2025-11-20 19:09:18.582383') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (40, 1, 'create_inspection', 'inspection', 3, '{"priority": "Medium", "vessel_id": "5", "inspection_type": "Initial"}', '2025-11-20 21:39:30.60587') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (41, 1, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2025-11-22T06:09:46.676Z", "login_method": "email"}', '2025-11-22 09:09:46.677037') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (42, 1, 'create_inspection', 'inspection', 4, '{"priority": "Medium", "vessel_id": "2", "inspection_type": "Initial"}', '2025-11-22 09:37:40.522986') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (43, 1, 'update_inspection', 'inspection', 4, '{"status": "draft", "remarks": "To be monitored on next opportunity.", "due_date": "2025-12-16", "priority": "Medium", "vessel_id": 2, "scheduled_date": "2025-11-29", "inspection_date": "2025-11-29", "inspection_type": "Initial", "findings_summary": "1.1 In general, equipment was found fully coated. All associate parts was noted on its position and in satisfactory condition.\n", "next_inspection_date": ""}', '2025-11-22 09:38:14.498775') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (44, 1, 'update_inspection', 'inspection', 4, '{"status": "draft", "remarks": "To be monitored on next opportunity.", "due_date": "2025-12-15", "priority": "Medium", "vessel_id": 2, "scheduled_date": "2025-11-30", "inspection_date": "2025-11-30", "inspection_type": "Initial", "findings_summary": "", "next_inspection_date": ""}', '2025-11-22 09:39:39.329061') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (45, 1, 'update_inspection', 'inspection', 4, '{"status": "draft", "remarks": "To be monitored on next opportunity.", "due_date": "2025-12-14", "priority": "Medium", "vessel_id": 2, "scheduled_date": "2025-11-30", "inspection_date": "2025-11-29", "inspection_type": "Initial", "findings_summary": "", "next_inspection_date": ""}', '2025-11-22 09:39:58.141105') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (46, 1, 'update_inspection', 'inspection', 4, '{"status": "draft", "remarks": "To be monitored on next opportunity.", "due_date": "2025-12-30", "priority": "Medium", "vessel_id": 2, "scheduled_date": "2025-12-03", "inspection_date": "2025-11-28", "inspection_type": "Initial", "findings_summary": "", "next_inspection_date": "2027-11-30"}', '2025-11-22 09:47:52.007767') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (47, 1, 'update_inspection', 'inspection', 4, '{"status": "draft", "remarks": "To be monitored on next opportunity.", "due_date": "2025-12-30", "priority": "Medium", "vessel_id": 2, "scheduled_date": "2025-12-03", "inspection_date": "2025-11-30", "inspection_type": "Initial", "findings_summary": "To be monitored on next opportunity.", "next_inspection_date": "2027-11-30"}', '2025-11-22 10:15:36.009131') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (48, 1, 'update_inspection', 'inspection', 4, '{"status": "draft", "remarks": "To be monitored on next opportunity.", "due_date": "2025-12-29", "priority": "Medium", "vessel_id": 2, "scheduled_date": "2025-12-02", "inspection_date": "2025-11-29", "inspection_type": "Initial", "findings_summary": "just for test", "next_inspection_date": "2027-11-30"}', '2025-11-22 10:28:06.907303') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (49, 1, 'update_inspection', 'inspection', 4, '{"status": "draft", "remarks": "To be monitored on next opportunity.", "due_date": "2025-12-28", "priority": "Medium", "vessel_id": 2, "scheduled_date": "2025-12-01", "inspection_date": "2025-11-28", "inspection_type": "Initial", "findings_summary": "just for test", "next_inspection_date": "2027-11-30"}', '2025-11-22 10:29:46.864006') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (50, 1, 'update_inspection', 'inspection', 4, '{"status": "draft", "remarks": "To be monitored on next opportunity.", "due_date": "2025-12-27", "priority": "Medium", "vessel_id": 2, "scheduled_date": "2025-11-30", "inspection_date": "2025-11-27", "inspection_type": "Initial", "findings_summary": "just for test", "next_inspection_date": "2027-11-29"}', '2025-11-22 10:31:13.508471') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (51, 1, 'update_inspection', 'inspection', 4, '{"status": "draft", "remarks": "To be monitored on next opportunity.", "due_date": "2025-12-26", "priority": "Medium", "vessel_id": 2, "scheduled_date": "2025-11-29", "inspection_date": "2025-11-26", "inspection_type": "Initial", "findings_summary": "just for test", "next_inspection_date": "2027-11-28"}', '2025-11-22 10:33:09.144609') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (52, 1, 'update_inspection', 'inspection', 4, '{"status": "draft", "remarks": "To be monitored on next opportunity.", "due_date": "2025-12-30", "priority": "Medium", "vessel_id": 2, "scheduled_date": "2025-11-30", "inspection_date": "2025-11-30", "inspection_type": "Initial", "findings_summary": "just for test", "next_inspection_date": "2027-11-30"}', '2025-11-22 11:23:57.145727') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (53, 5, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2025-11-22T11:05:56.178Z", "login_method": "username"}', '2025-11-22 14:05:56.179468') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (54, 1, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2025-11-22T11:08:13.612Z", "login_method": "email"}', '2025-11-22 14:08:13.612883') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (55, 1, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2025-11-22T11:09:46.420Z", "login_method": "email"}', '2025-11-22 14:09:46.421114') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (56, 1, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2025-11-23T03:13:08.405Z", "login_method": "email"}', '2025-11-23 06:13:08.406274') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (57, 1, 'update_observation', 'observation', 4, '{"status": "Monitoring Required", "location": "3 o''clock position", "priority": "Low", "severity": "Minor", "component": "Weldment", "vessel_id": 2, "description": "2.3.1 Manhole weldment was found in serviceable condition except for evidence of pitting at 3 o''clock position.", "inspection_id": 1, "finding_number": "2.3", "recommendation": "2.3.1 To be monitored on next opportunity", "action_required": "Monitor", "observation_type": "Pitting"}', '2025-11-23 06:39:31.072987') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (58, 1, 'create_observation', 'observation', 5, '{"severity": "Minor", "component": "Weldment", "inspection_id": 4, "observation_type": "General Wear"}', '2025-11-23 06:42:09.475156') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (59, 1, 'update_observation', 'observation', 5, '{"status": "Open", "location": "Top Head", "priority": "Medium", "severity": "Minor", "component": "Weldment", "vessel_id": 2, "description": "1.1 Through-wall corrosion detected with active leak or imminent failure risk\n\n1.2 External corrosion detected on shell surface, localized area approximately 50mm x 50mm with minimal metal loss\n\n1.3 General corrosion observed with pitting depth up to 2mm across affected area", "inspection_id": 4, "finding_number": "1", "recommendation": "1.1 1.1 Schedule repair during next planned shutdown within 30 days\n\n1.2 Engineering assessment required to determine repair methodology", "action_required": "Repair", "observation_type": "Corrosion"}', '2025-11-23 06:50:16.732373') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (60, 1, 'create_observation', 'observation', 6, '{"severity": "Moderate", "component": "Shell", "inspection_id": 4, "observation_type": "Corrosion"}', '2025-11-23 08:32:03.468957') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (61, 1, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2025-11-23T11:51:24.743Z", "login_method": "email"}', '2025-11-23 14:51:24.744552') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (62, 1, 'delete_observation', 'observation', 3, '{"component": "Manhole", "inspection_id": 1, "observation_type": "Deformation"}', '2025-11-23 18:34:34.911991') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (63, 1, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2025-11-24T04:10:29.653Z", "login_method": "email"}', '2025-11-24 07:10:29.654514') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (64, 5, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2025-11-24T04:15:30.317Z", "login_method": "username"}', '2025-11-24 07:15:30.318575') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (65, 1, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2025-11-24T14:42:17.336Z", "login_method": "email"}', '2025-11-24 17:42:17.337955') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (66, 1, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2025-11-25T05:11:01.875Z", "login_method": "email"}', '2025-11-25 08:11:01.876551') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (67, 1, 'generate_report', 'inspection', 4, '{"filename": "R-201_4_1764047692807.pdf", "report_number": "PLANT1/VI/R-201/TA2025"}', '2025-11-25 08:14:52.87711') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (68, 1, 'generate_report', 'inspection', 4, '{"filename": "R-201_4_1764049324722.pdf", "report_number": "PLANT1/VI/R-201/TA2025"}', '2025-11-25 08:42:05.335516') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (69, 1, 'delete_report', 'inspection', 4, '{}', '2025-11-25 10:10:24.140379') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (70, 1, 'generate_report', 'inspection', 4, '{"filename": "R-201_4_1764054626329.pdf", "report_number": "PLANT/01/VR-R-201/TA2025"}', '2025-11-25 10:10:26.860285') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (71, 1, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2025-11-25T07:18:32.946Z", "login_method": "username"}', '2025-11-25 10:18:32.947318') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (72, 1, 'create_user', 'user', 6, '{"role": "reviewer", "email": "reviewer@ipetro.com", "username": "faisal", "created_user": "faisal"}', '2025-11-25 10:21:58.821967') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (73, 6, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2025-11-25T07:22:19.787Z", "login_method": "username"}', '2025-11-25 10:22:19.78867') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (74, 1, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2025-11-25T07:24:31.385Z", "login_method": "email"}', '2025-11-25 10:24:31.386576') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (75, 1, 'generate_report', 'inspection', 2, '{"filename": "HX-301_2_1764055486068.pdf", "report_number": "PLANT1/VI/HX-301/TA2025"}', '2025-11-25 10:24:46.13004') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (76, 1, 'generate_report', 'inspection', 1, '{"filename": "R-201_1_1764066331090.pdf", "report_number": "PLANT/01/VR-R-201/TA2025"}', '2025-11-25 13:25:31.147629') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (124, 7, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2025-12-05T06:46:55.609Z", "login_method": "username"}', '2025-12-05 09:46:55.609705') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (77, 1, 'create_observation', 'observation', 7, '{"severity": "Moderate", "component": "Nozzle", "inspection_id": 2, "observation_type": "Corrosion"}', '2025-11-25 13:27:49.971095') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (78, 1, 'generate_report', 'inspection', 2, '{"filename": "HX-301_2_1764066522958.pdf", "report_number": "PLANT1/VI/HX-301/TA2025"}', '2025-11-25 13:28:43.251501') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (79, 1, 'generate_report', 'inspection', 2, '{"filename": "HX-301_2_1764067261825.pdf", "report_number": "PLANT1/VI/HX-301/TA2025"}', '2025-11-25 13:41:02.142218') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (80, 1, 'create_observation', 'observation', 8, '{"severity": "Critical", "component": "Shell", "inspection_id": 2, "observation_type": "Cracking"}', '2025-11-25 13:58:36.620097') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (81, 1, 'generate_report', 'inspection', 2, '{"filename": "Visual Inspection Report_HX-301}.pdf", "report_number": "PLANT1/VI/HX-301/TA2025"}', '2025-11-25 13:58:55.855417') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (82, 1, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2025-11-25T17:19:52.427Z", "login_method": "email"}', '2025-11-25 20:19:52.428887') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (83, 1, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2025-11-26T02:35:34.770Z", "login_method": "email"}', '2025-11-26 05:35:34.771669') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (84, 1, 'update_user', 'user', 5, '{"name": "Ahmed", "role": "inspector", "email": "ahmed@ipetro.com", "phone": "01137654853", "department": "Field Operations", "employee_id": ""}', '2025-11-26 05:56:13.80627') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (85, 1, 'delete_user', 'user', 2, '{"deleted_user": "Mohammed Ali Al-Selwi"}', '2025-11-26 06:08:20.470473') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (86, 1, 'delete_user', 'user', 2, '{"deleted_user": "Mohammed Ali Al-Selwi"}', '2025-11-26 06:08:44.175598') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (87, 1, 'delete_user', 'user', 2, '{"deleted_user": "Mohammed Ali Al-Selwi"}', '2025-11-26 06:08:59.248128') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (88, 1, 'update_user', 'user', 1, '{"name": "System Administrator", "role": "admin", "email": "admin@ipetro.com", "phone": "", "department": "Administration", "employee_id": ""}', '2025-11-26 06:09:51.313069') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (89, 1, 'update_user', 'user', 2, '{"name": "Mohammed Ali Al-Selwi", "role": "inspector", "email": "mohammedali@ipetro.com", "phone": "", "department": "Field Operations - Senior Team", "employee_id": ""}', '2025-11-26 06:18:46.370219') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (90, 1, 'update_user', 'user', 3, '{"name": "Fahad Khalid Mohammed", "role": "reviewer", "email": "fahad@ipetro.com", "username": "reviewer01", "department": "Quality Assurance", "certification_id": "QA-001"}', '2025-11-26 06:35:09.491238') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (91, 1, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2025-11-26T03:40:38.256Z", "login_method": "email"}', '2025-11-26 06:40:38.25723') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (92, 1, 'reset_password', 'user', 6, '{"target_user": "faisal"}', '2025-11-26 06:41:14.337667') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (93, 6, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2025-11-26T03:41:35.397Z", "login_method": "username"}', '2025-11-26 06:41:35.398413') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (94, 6, 'update_user', 'user', 6, '{"name": "faisal Ahmed Qaid", "email": "reviewer@ipetro.com", "username": "faisal", "department": "QA Department", "certification_id": "QA-02319"}', '2025-11-26 06:42:35.318324') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (95, 1, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2025-11-26T03:42:48.242Z", "login_method": "email"}', '2025-11-26 06:42:48.243149') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (96, 1, 'delete_user', 'user', 2, '{"deleted_user": "Mohammed Ali Al-Selwi"}', '2025-11-26 06:43:46.352353') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (97, 1, 'create_user', 'user', 7, '{"role": "inspector", "email": "ahmedq@ipetro.com", "username": "ahmed", "created_user": "Ahmed Mohammed Qaid"}', '2025-11-26 06:45:49.289904') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (98, 7, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2025-11-26T03:46:18.978Z", "login_method": "username"}', '2025-11-26 06:46:18.980313') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (99, 1, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2025-11-26T03:46:31.483Z", "login_method": "email"}', '2025-11-26 06:46:31.484376') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (100, 7, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2025-11-26T03:47:07.471Z", "login_method": "username"}', '2025-11-26 06:47:07.472013') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (101, 1, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2025-11-26T03:47:16.752Z", "login_method": "email"}', '2025-11-26 06:47:16.753456') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (102, 1, 'update_user', 'user', 2, '{"name": "Mohammed Ali", "role": "inspector", "email": "mohammedali@ipetro.com", "username": "inspector01", "department": "Field Operations - Senior Team", "certification_id": "API-510-12345-UPDATED"}', '2025-11-26 06:50:56.318316') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (103, 1, 'reset_password', 'user', 2, '{"target_user": "Mohammed Ali"}', '2025-11-26 06:51:28.650885') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (104, 1, 'update_user', 'user', 1, '{"name": "Faisal Ahmed Mohammed Qaid", "email": "admin@ipetro.com", "username": "admin", "department": "Administration", "certification_id": ""}', '2025-11-26 06:58:08.962233') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (105, 1, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2025-11-29T09:54:24.826Z", "login_method": "email"}', '2025-11-29 12:54:24.829478') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (106, 1, 'update_report_status', 'inspection', 1, '{"status": "changes_requested", "review_comments": "Error Loading images"}', '2025-11-29 13:08:40.548413') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (107, 1, 'update_report_status', 'inspection', 2, '{"status": "approved", "review_comments": ""}', '2025-11-29 13:09:03.023923') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (108, 1, 'update_inspection', 'inspection', 4, '{"status": "under_review", "remarks": "To be monitored on next opportunity.", "due_date": "2025-12-30", "priority": "Medium", "vessel_id": 2, "scheduled_date": "2025-11-30", "inspection_date": "2025-11-30", "inspection_type": "Initial", "findings_summary": "just for test", "next_inspection_date": "2027-11-30"}', '2025-11-29 13:09:29.004499') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (109, 1, 'update_inspection', 'inspection', 4, '{"status": "under_review", "remarks": "To be monitored on next opportunity.", "due_date": "2025-12-30", "priority": "Medium", "vessel_id": 2, "scheduled_date": "2025-11-30", "inspection_date": "2025-11-30", "inspection_type": "Initial", "findings_summary": "just for test", "next_inspection_date": "2027-11-30"}', '2025-11-29 13:09:52.707899') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (110, 1, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2025-11-29T10:12:15.159Z", "login_method": "email"}', '2025-11-29 13:12:15.159901') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (111, 1, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2025-11-29T10:13:28.195Z", "login_method": "email"}', '2025-11-29 13:13:28.196247') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (112, 1, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2025-12-01T01:29:27.116Z", "login_method": "email"}', '2025-12-01 04:29:27.11875') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (113, 1, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2025-12-02T03:52:47.823Z", "login_method": "email"}', '2025-12-02 06:52:47.825104') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (114, 1, 'delete_inspection', 'inspection', 1, '{}', '2025-12-02 06:56:09.621593') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (115, 1, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2025-12-02T05:51:22.287Z", "login_method": "email"}', '2025-12-02 08:51:22.288323') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (116, 7, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2025-12-02T06:31:48.204Z", "login_method": "username"}', '2025-12-02 09:31:48.20608') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (117, 1, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2025-12-02T07:21:10.859Z", "login_method": "email"}', '2025-12-02 10:21:10.86092') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (118, 1, 'create_inspection', 'inspection', 5, '{"priority": "High", "vessel_id": "4", "inspection_type": "Initial"}', '2025-12-02 13:23:59.215098') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (119, 1, 'create_observation', 'observation', 9, '{"severity": "Critical", "component": "Shell", "inspection_id": 5, "observation_type": "Deformation"}', '2025-12-02 13:25:35.232517') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (120, 1, 'generate_report', 'inspection', 5, '{"filename": "Visual Inspection Report_S-401}.pdf", "report_number": "PLANT/01/VR-S-401/TA2025"}', '2025-12-02 13:26:42.426761') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (121, 1, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2025-12-05T06:43:21.435Z", "login_method": "email"}', '2025-12-05 09:43:21.435912') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (122, 1, 'create_user', 'user', 8, '{"role": "reviewer", "email": "fis@ipetro.com", "username": "faisal1", "created_user": "Faisal Harith"}', '2025-12-05 09:45:08.953337') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (123, 8, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2025-12-05T06:45:55.097Z", "login_method": "username"}', '2025-12-05 09:45:55.098761') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (125, 7, 'create_inspection', 'inspection', 6, '{"priority": "Medium", "vessel_id": "5", "inspection_type": "Initial"}', '2025-12-05 09:48:05.981903') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (126, 7, 'create_observation', 'observation', 10, '{"severity": "Moderate", "component": "Weldment", "inspection_id": 6, "observation_type": "Corrosion"}', '2025-12-05 09:49:05.703184') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (127, 7, 'create_observation', 'observation', 11, '{"severity": "Minor", "component": "Shell", "inspection_id": 6, "observation_type": "Corrosion"}', '2025-12-05 09:49:41.916167') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (128, 7, 'generate_report', 'inspection', 6, '{"filename": "Visual Inspection Report_V-001}.pdf", "report_number": "PLANT/01/VR-V-001/TA2025"}', '2025-12-05 09:51:16.561811') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (129, 7, 'update_inspection', 'inspection', 6, '{"status": "submitted", "remarks": "", "due_date": "2025-12-24", "priority": "Medium", "vessel_id": 5, "scheduled_date": "2025-12-05", "inspection_date": "2025-12-05", "inspection_type": "Initial", "findings_summary": "", "next_inspection_date": "2027-12-05"}', '2025-12-05 09:52:20.64611') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (130, 1, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2025-12-05T07:08:23.193Z", "login_method": "email"}', '2025-12-05 10:08:23.194166') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (131, 1, 'create_vessel', 'vessel', 7, '{"tag_no": "V-003", "vessel_type": "Reactor"}', '2025-12-05 10:09:34.818673') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (132, 1, 'delete_vessel', 'vessel', 7, '{"deleted_tag_no": "V-003", "deleted_vessel_type": "Reactor"}', '2025-12-05 10:09:52.586303') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (133, 1, 'create_inspection', 'inspection', 7, '{"priority": "Medium", "vessel_id": "5", "inspection_type": "Initial"}', '2025-12-05 10:11:14.441383') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (134, 1, 'create_observation', 'observation', 12, '{"severity": "Moderate", "component": "Weldment", "inspection_id": 7, "observation_type": "Corrosion"}', '2025-12-05 10:12:41.748449') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (135, 1, 'generate_report', 'inspection', 7, '{"filename": "Visual Inspection Report_V-001}.pdf", "report_number": "PLANT/01/VR-V-001/TA2025"}', '2025-12-05 10:14:07.565722') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (136, 1, 'update_report_status', 'inspection', 7, '{"status": "changes_requested", "review_comments": "it needs improvements"}', '2025-12-05 10:16:39.931554') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (137, 8, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2025-12-06T04:20:11.457Z", "login_method": "username"}', '2025-12-06 07:20:11.465558') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (138, 1, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2025-12-06T04:20:35.055Z", "login_method": "email"}', '2025-12-06 07:20:35.061351') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (139, 8, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2025-12-06T04:51:55.862Z", "login_method": "username"}', '2025-12-06 07:51:55.865383') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (140, 8, 'update_report_status', 'inspection', 6, '{"status": "approved", "review_comments": ""}', '2025-12-06 07:52:08.130938') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (141, 1, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2025-12-06T04:54:35.227Z", "login_method": "email"}', '2025-12-06 07:54:35.227912') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (142, 1, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2025-12-06T05:05:02.080Z", "login_method": "email"}', '2025-12-06 08:05:02.081773') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (143, 7, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2025-12-06T05:10:47.293Z", "login_method": "username"}', '2025-12-06 08:10:47.296123') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (144, 8, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2025-12-06T05:11:13.695Z", "login_method": "username"}', '2025-12-06 08:11:13.698156') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (145, 8, 'update_report_status', 'inspection', 5, '{"status": "approved", "review_comments": ""}', '2025-12-06 15:27:26.461817') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (146, 1, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2025-12-07T03:57:29.095Z", "login_method": "email"}', '2025-12-07 06:57:29.098042') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (147, 1, 'update_report_status', 'inspection', 7, '{"status": "rejected", "review_comments": ""}', '2025-12-07 06:59:29.01804') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (148, 1, 'update_report_status', 'inspection', 7, '{"status": "changes_requested", "review_comments": ""}', '2025-12-07 06:59:35.186215') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (149, 1, 'update_inspection', 'inspection', 7, '{"status": "approved", "remarks": "", "due_date": "2025-12-13", "priority": "Medium", "vessel_id": 5, "scheduled_date": "2025-12-05", "inspection_date": "2025-12-05", "inspection_type": "Initial", "findings_summary": "", "next_inspection_date": "2027-12-05"}', '2025-12-07 07:09:52.15187') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (150, 1, 'update_inspection', 'inspection', 7, '{"status": "submitted", "remarks": "", "due_date": "2025-12-13", "priority": "Medium", "vessel_id": 5, "scheduled_date": "2025-12-05", "inspection_date": "2025-12-05", "inspection_type": "Initial", "findings_summary": "", "next_inspection_date": "2027-12-05"}', '2025-12-07 07:10:02.640928') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (151, 1, 'update_inspection', 'inspection', 7, '{"status": "submitted", "remarks": "", "due_date": "2025-12-13", "priority": "Medium", "vessel_id": 5, "scheduled_date": "2025-12-05", "inspection_date": "2025-12-05", "inspection_type": "Initial", "findings_summary": "", "next_inspection_date": "2027-12-05"}', '2025-12-07 07:10:14.876333') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (152, 1, 'update_report_status', 'inspection', 4, '{"status": "rejected", "review_comments": ""}', '2025-12-07 07:10:59.031363') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (153, 8, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2025-12-07T04:58:52.616Z", "login_method": "username"}', '2025-12-07 07:58:52.617596') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (154, 8, 'update_report_status', 'inspection', 7, '{"status": "approved", "review_comments": ""}', '2025-12-07 07:59:29.899221') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (155, 8, 'generate_report', 'inspection', 7, '{"filename": "Visual Inspection Report_V-001}.pdf", "report_number": "PLANT/01/VR-V-001/TA2025"}', '2025-12-07 08:00:03.473199') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (156, 7, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2025-12-07T05:00:33.407Z", "login_method": "username"}', '2025-12-07 08:00:33.410457') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (157, 7, 'generate_report', 'inspection', 6, '{"filename": "Visual Inspection Report_V-001}.pdf", "report_number": "PLANT/01/VR-V-001/TA2025"}', '2025-12-07 12:20:31.431449') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (158, 7, 'generate_report', 'inspection', 6, '{"filename": "Visual Inspection Report_V-001}.pdf", "report_number": "PLANT/01/VR-V-001/TA2025"}', '2025-12-07 12:36:21.312386') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (159, 1, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2025-12-11T04:30:48.852Z", "login_method": "username"}', '2025-12-11 07:30:48.854945') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (160, 1, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2025-12-13T00:31:33.072Z", "login_method": "username"}', '2025-12-13 03:31:33.073315') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (161, 1, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2025-12-13T02:19:39.458Z", "login_method": "email"}', '2025-12-13 05:19:39.45976') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (162, 1, 'generate_report', 'inspection', 7, '{"filename": "Visual Inspection Report_V-001.pdf", "report_number": "PLANT/01/VR-V-001/TA2025"}', '2025-12-13 05:26:34.683404') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (163, 1, 'generate_report', 'inspection', 7, '{"filename": "Visual Inspection Report_V-001.pdf", "report_number": "PLANT/01/VR-V-001/TA2025"}', '2025-12-13 05:28:20.558349') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (164, 7, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2025-12-13T04:36:41.004Z", "login_method": "username"}', '2025-12-13 07:36:41.005269') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (165, 1, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2025-12-13T04:37:03.352Z", "login_method": "email"}', '2025-12-13 07:37:03.353111') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (166, 1, 'generate_report', 'inspection', 2, '{"filename": "Visual Inspection Report_HX-301.pdf", "report_number": "PLANT1/VI/HX-301/TA2025"}', '2025-12-13 09:57:47.144346') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (167, 1, 'generate_report', 'inspection', 2, '{"filename": "Visual Inspection Report_HX-301.pdf", "report_number": "PLANT1/VI/HX-301/TA2025"}', '2025-12-13 10:01:51.655577') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (168, 1, 'generate_report', 'inspection', 2, '{"filename": "Visual Inspection Report_HX-301.pdf", "report_number": "PLANT1/VI/HX-301/TA2025"}', '2025-12-13 10:03:20.458899') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (240, 1, 'create_observation', 'observation', 25, '{"severity": "Minor", "component": "manhole cover", "inspection_id": 8, "observation_type": "Other"}', '2025-12-22 13:26:58.64583') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (242, 1, 'create_observation', 'observation', 26, '{"severity": "Minor", "component": "manhole flange", "inspection_id": 8, "observation_type": "Other"}', '2025-12-24 11:31:38.257516') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (169, 1, 'update_observation', 'observation', 8, '{"status": "Monitoring Required", "location": "3 o''clock position", "priority": "Critical", "severity": "Critical", "component": "Shell", "vessel_id": 3, "description": "2.1 2.1 Hairline surface crack detected, length < 25mm, no propagation evidence\n\n2.2 2.2 Crack detected in weld seam, length > 50mm, requires immediate attention", "inspection_id": 2, "finding_number": "2", "recommendation": "2.1 2.1 Immediate shutdown and repair required before return to service\n\n2.2 Implement temporary repair and schedule permanent fix within 48 hours", "action_required": "Immediate Action", "observation_type": "Cracking"}', '2025-12-13 10:15:02.399516') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (170, 1, 'generate_report', 'inspection', 7, '{"filename": "Visual Inspection Report_V-001.pdf", "report_number": "PLANT/01/VR-V-001/TA2025"}', '2025-12-13 10:50:03.141723') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (171, 1, 'generate_report', 'inspection', 7, '{"filename": "Visual Inspection Report_V-001.pdf", "report_number": "PLANT/01/VR-V-001/TA2025"}', '2025-12-13 12:46:22.523542') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (172, 1, 'generate_report', 'inspection', 7, '{"filename": "Visual Inspection Report_V-001.pdf", "report_number": "PLANT/01/VR-V-001/TA2025"}', '2025-12-13 12:47:02.898917') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (173, 1, 'generate_report', 'inspection', 6, '{"filename": "Visual Inspection Report_V-001.pdf", "report_number": "PLANT/01/VR-V-001/TA2025"}', '2025-12-13 13:25:43.166619') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (174, 1, 'generate_report', 'inspection', 7, '{"filename": "Visual Inspection Report_V-001.pdf", "report_number": "PLANT/01/VR-V-001/TA2025"}', '2025-12-13 13:32:52.444685') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (175, 1, 'generate_report', 'inspection', 4, '{"filename": "Visual Inspection Report_R-201.pdf", "report_number": "PLANT/01/VR-R-201/TA2025"}', '2025-12-13 13:33:31.424028') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (176, 1, 'generate_report', 'inspection', 6, '{"filename": "Visual Inspection Report_V-001.pdf", "report_number": "PLANT/01/VR-V-001/TA2025"}', '2025-12-13 13:38:44.467372') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (177, 1, 'generate_report', 'inspection', 6, '{"filename": "Visual Inspection Report_V-001.pdf", "report_number": "PLANT/01/VR-V-001/TA2025"}', '2025-12-13 14:00:56.87605') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (178, 1, 'generate_report', 'inspection', 6, '{"filename": "Visual Inspection Report_V-001.pdf", "report_number": "PLANT/01/VR-V-001/TA2025"}', '2025-12-13 14:01:33.903185') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (179, 1, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2025-12-13T12:59:52.438Z", "login_method": "email"}', '2025-12-13 15:59:52.440558') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (180, 1, 'generate_report', 'inspection', 6, '{"filename": "Visual Inspection Report_V-001.pdf", "report_number": "PLANT/01/VR-V-001/TA2025"}', '2025-12-13 16:00:09.78602') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (181, 8, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2025-12-13T13:17:23.515Z", "login_method": "username"}', '2025-12-13 16:17:23.516263') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (182, 8, 'update_report_status', 'inspection', 4, '{"status": "approved", "review_comments": ""}', '2025-12-13 16:20:15.521941') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (183, 8, 'update_report_status', 'inspection', 5, '{"status": "approved", "review_comments": ""}', '2025-12-13 16:20:30.397053') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (184, 1, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2025-12-13T13:35:56.169Z", "login_method": "email"}', '2025-12-13 16:35:56.170256') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (185, 1, 'generate_report', 'inspection', 4, '{"filename": "Visual Inspection Report_R-201.pdf", "report_number": "PLANT/01/VR-R-201/TA2025"}', '2025-12-13 16:36:55.70931') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (186, 1, 'generate_report', 'inspection', 7, '{"filename": "Visual Inspection Report_V-001.pdf", "report_number": "PLANT/01/VR-V-001/TA2025"}', '2025-12-13 16:37:17.447799') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (187, 1, 'generate_report', 'inspection', 6, '{"filename": "Visual Inspection Report_V-001.pdf", "report_number": "PLANT/01/VR-V-001/TA2025"}', '2025-12-13 16:38:12.353024') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (188, 1, 'generate_report', 'inspection', 2, '{"filename": "Visual Inspection Report_HX-301.pdf", "report_number": "PLANT1/VI/HX-301/TA2025"}', '2025-12-13 16:40:41.488109') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (189, 8, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2025-12-13T13:41:26.006Z", "login_method": "username"}', '2025-12-13 16:41:26.006874') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (190, 8, 'update_report_status', 'inspection', 2, '{"status": "approved", "review_comments": ""}', '2025-12-13 16:41:35.935118') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (191, 1, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2025-12-13T13:41:42.256Z", "login_method": "email"}', '2025-12-13 16:41:42.257256') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (192, 1, 'generate_report', 'inspection', 2, '{"filename": "Visual Inspection Report_HX-301.pdf", "report_number": "PLANT1/VI/HX-301/TA2025"}', '2025-12-13 16:41:49.299922') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (193, 1, 'generate_report', 'inspection', 6, '{"filename": "Visual Inspection Report_V-001.pdf", "report_number": "PLANT/01/VR-V-001/TA2025"}', '2025-12-13 17:07:33.727045') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (194, 1, 'generate_report', 'inspection', 2, '{"filename": "Visual Inspection Report_HX-301.pdf", "report_number": "PLANT1/VI/HX-301/TA2025"}', '2025-12-13 17:07:41.706425') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (195, 1, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2025-12-14T12:07:57.400Z", "login_method": "email"}', '2025-12-14 15:07:57.401658') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (196, 1, 'generate_report', 'inspection', 6, '{"filename": "Visual Inspection Report_V-001.pdf", "report_number": "PLANT/01/VR-V-001/TA2025"}', '2025-12-14 15:23:23.877863') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (197, 1, 'generate_report', 'inspection', 2, '{"filename": "Visual Inspection Report_HX-301.pdf", "report_number": "PLANT1/VI/HX-301/TA2025"}', '2025-12-14 15:31:30.96185') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (198, 1, 'generate_report', 'inspection', 2, '{"filename": "Visual Inspection Report_HX-301.pdf", "report_number": "PLANT1/VI/HX-301/TA2025"}', '2025-12-14 17:02:23.219176') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (199, 1, 'generate_report', 'inspection', 2, '{"filename": "Visual Inspection Report_HX-301.pdf", "report_number": "PLANT1/VI/HX-301/TA2025"}', '2025-12-14 17:32:26.976066') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (200, 1, 'create_observation', 'observation', 13, '{"severity": "Moderate", "component": "Shell", "inspection_id": 2, "observation_type": "Corrosion"}', '2025-12-14 17:35:27.840661') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (201, 1, 'create_observation', 'observation', 14, '{"severity": "Major", "component": "Nozzle", "inspection_id": 2, "observation_type": "Cracking"}', '2025-12-14 17:37:13.314149') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (202, 1, 'update_observation', 'observation', 13, '{"status": "Open", "location": "Top", "priority": "Medium", "severity": "Moderate", "component": "Shell", "vessel_id": 3, "description": "3.1 3.1 Through-wall corrosion detected with active leak or imminent failure risk\n\n3.2 3.2 External corrosion detected on shell surface, localized area approximately 50mm x 50mm with minimal metal loss\n\n3.3 Minor dent observed, depth < 5mm, no structural concern\n\n3.4 Significant deformation affecting structural integrity", "inspection_id": 2, "finding_number": "3", "recommendation": "3.1 3.1 Monitor on next scheduled inspection, no immediate action required\n\n3.2 3.2 Schedule repair during next planned shutdown within 30 days\n\n3.3 Finding noted for documentation purposes, no repair needed\n\n3.4 Plan repair for next major turnaround", "action_required": "Repair", "observation_type": "Deformation"}', '2025-12-14 17:41:21.263445') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (203, 1, 'update_observation', 'observation', 14, '{"status": "Open", "location": "3 o''clock position", "priority": "High", "severity": "Major", "component": "Nozzle", "vessel_id": 3, "description": "4.1 4.1 Crack detected in weld seam, length > 50mm, requires immediate attention\n\n4.2 4.2 Hairline surface crack detected, length < 25mm, no propagation evidence\n\n4.3 Through-wall crack with active leak, immediate shutdown required", "inspection_id": 2, "finding_number": "4", "recommendation": "4.1 4.1 Engineering assessment required to determine repair methodology\n\n4.2 4.2 Acceptable per code requirements, no action required\n\n4.3 Engineering assessment required to determine repair methodology", "action_required": "Repair", "observation_type": "Cracking"}', '2025-12-14 17:42:13.17286') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (241, 1, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2025-12-24T08:22:19.942Z", "login_method": "email"}', '2025-12-24 11:22:19.944201') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (204, 1, 'update_observation', 'observation', 14, '{"status": "Open", "location": "3 o''clock position", "priority": "High", "severity": "Major", "component": "Nozzle", "vessel_id": 3, "description": "4.1  Crack detected in weld seam, length > 50mm, requires immediate attention\n\n4.2  Hairline surface crack detected, length < 25mm, no propagation evidence\n\n4.3 Through-wall crack with active leak, immediate shutdown required", "inspection_id": 2, "finding_number": "4", "recommendation": "4.1 Engineering assessment required to determine repair methodology\n\n4.2  Acceptable per code requirements, no action required\n\n4.3 Engineering assessment required to determine repair methodology", "action_required": "Repair", "observation_type": "Cracking"}', '2025-12-14 17:43:05.046119') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (205, 1, 'generate_report', 'inspection', 2, '{"filename": "Visual Inspection Report_HX-301.pdf", "report_number": "PLANT1/VI/HX-301/TA2025"}', '2025-12-14 17:43:11.6399') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (206, 1, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2025-12-15T04:26:57.899Z", "login_method": "email"}', '2025-12-15 07:26:57.900302') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (207, 1, 'generate_report', 'inspection', 2, '{"filename": "Visual Inspection Report_HX-301.pdf", "report_number": "PLANT1/VI/HX-301/TA2025"}', '2025-12-15 07:27:13.910281') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (208, 1, 'generate_report', 'inspection', 6, '{"filename": "Visual Inspection Report_V-001.pdf", "report_number": "PLANT/01/VR-V-001/TA2025"}', '2025-12-15 07:27:57.214845') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (209, 1, 'generate_report', 'inspection', 6, '{"filename": "Visual Inspection Report_V-001.pdf", "report_number": "PLANT/01/VR-V-001/TA2025"}', '2025-12-15 07:28:01.230477') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (210, 1, 'generate_report', 'inspection', 6, '{"filename": "Visual Inspection Report_V-001.pdf", "report_number": "PLANT/01/VR-V-001/TA2025"}', '2025-12-15 07:28:11.523481') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (211, 1, 'generate_report', 'inspection', 2, '{"filename": "Visual Inspection Report_HX-301.pdf", "report_number": "PLANT1/VI/HX-301/TA2025"}', '2025-12-15 07:51:08.265511') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (212, 1, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2025-12-18T06:42:35.348Z", "login_method": "email"}', '2025-12-18 09:42:35.34915') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (213, 1, 'update_inspection', 'inspection', 7, '{"status": "submitted", "remarks": "", "due_date": "2025-12-13", "priority": "Medium", "vessel_id": 5, "scheduled_date": "2025-12-05", "inspection_date": "2025-12-05", "inspection_type": "Initial", "findings_summary": "", "next_inspection_date": "2027-12-05"}', '2025-12-18 12:21:32.996893') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (214, 1, 'update_inspection', 'inspection', 7, '{"status": "under_review", "remarks": "", "due_date": "2025-12-13", "priority": "Medium", "vessel_id": 5, "scheduled_date": "2025-12-05", "inspection_date": "2025-12-05", "inspection_type": "Initial", "findings_summary": "", "next_inspection_date": "2027-12-05"}', '2025-12-18 12:21:48.903148') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (215, 1, 'update_inspection', 'inspection', 7, '{"status": "approved", "remarks": "", "due_date": "2025-12-13", "priority": "Medium", "vessel_id": 5, "scheduled_date": "2025-12-05", "inspection_date": "2025-12-05", "inspection_type": "Initial", "findings_summary": "", "next_inspection_date": "2027-12-05"}', '2025-12-18 12:21:57.828115') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (216, 1, 'generate_report', 'inspection', 2, '{"filename": "Visual Inspection Report_HX-301.pdf", "report_number": "PLANT1/VI/HX-301/TA2025"}', '2025-12-18 12:32:24.006835') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (217, 1, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2025-12-22T04:13:52.875Z", "login_method": "email"}', '2025-12-22 07:13:52.876092') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (218, 1, 'generate_report', 'inspection', 2, '{"filename": "Visual Inspection Report_HX-301.pdf", "report_number": "PLANT1/VI/HX-301/TA2025"}', '2025-12-22 10:41:10.537206') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (219, 1, 'generate_report', 'inspection', 2, '{"filename": "Visual Inspection Report_HX-301.pdf", "report_number": "PLANT1/VI/HX-301/TA2025"}', '2025-12-22 10:46:25.670052') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (220, 1, 'generate_report', 'inspection', 2, '{"filename": "Visual Inspection Report_HX-301.pdf", "report_number": "PLANT1/VI/HX-301/TA2025"}', '2025-12-22 10:56:24.597572') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (221, 1, 'generate_report', 'inspection', 2, '{"filename": "Visual Inspection Report_HX-301.pdf", "report_number": "PLANT1/VI/HX-301/TA2025"}', '2025-12-22 11:47:16.216168') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (222, 1, 'generate_report', 'inspection', 2, '{"filename": "Visual Inspection Report_HX-301.pdf", "report_number": "PLANT1/VI/HX-301/TA2025"}', '2025-12-22 12:43:02.354928') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (223, 1, 'generate_report', 'inspection', 6, '{"filename": "Visual Inspection Report_V-001.pdf", "report_number": "PLANT/01/VR-V-001/TA2025"}', '2025-12-22 12:44:51.081537') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (224, 1, 'generate_report', 'inspection', 6, '{"filename": "Visual Inspection Report_V-001.pdf", "report_number": "PLANT/01/VR-V-001/TA2025"}', '2025-12-22 12:46:54.205589') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (225, 1, 'generate_report', 'inspection', 6, '{"filename": "Visual Inspection Report_V-001.pdf", "report_number": "PLANT/01/VR-V-001/TA2025"}', '2025-12-22 12:49:04.618055') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (226, 1, 'generate_report', 'inspection', 6, '{"filename": "Visual Inspection Report_V-001.pdf", "report_number": "PLANT/01/VR-V-001/TA2025"}', '2025-12-22 12:49:38.714919') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (227, 1, 'create_inspection', 'inspection', 8, '{"priority": "Medium", "vessel_id": "5", "inspection_type": "Initial"}', '2025-12-22 12:52:15.926102') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (228, 1, 'create_observation', 'observation', 15, '{"severity": "Minor", "component": "V-950A", "inspection_id": 8, "observation_type": "General Wear"}', '2025-12-22 13:02:05.078608') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (229, 1, 'create_observation', 'observation', 16, '{"severity": "Minor", "component": "Nameplate", "inspection_id": 8, "observation_type": "Other"}', '2025-12-22 13:06:44.417749') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (230, 1, 'create_observation', 'observation', 17, '{"severity": "Minor", "component": "Concrete", "inspection_id": 8, "observation_type": "Other"}', '2025-12-22 13:09:20.928191') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (231, 1, 'create_observation', 'observation', 18, '{"severity": "Minor", "component": "bottom dish head", "inspection_id": 8, "observation_type": "General Wear"}', '2025-12-22 13:11:43.486344') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (232, 1, 'create_observation', 'observation', 19, '{"severity": "Minor", "component": "Weldment", "inspection_id": 8, "observation_type": "General Wear"}', '2025-12-22 13:12:03.487524') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (233, 1, 'delete_observation', 'observation', 19, '{"component": "Weldment", "inspection_id": 8, "observation_type": "General Wear"}', '2025-12-22 13:12:10.886949') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (234, 1, 'update_observation', 'observation', 17, '{"status": "Open", "location": "", "priority": "Low", "severity": "Minor", "component": "Concrete", "vessel_id": 5, "description": "3.1 Concrete foundation and support legs were observed in satisfactory condition with no sign of abnormalities.\n\n3.2 Anchor bolts observed secured tighten and in good condition.", "inspection_id": 8, "finding_number": "3", "recommendation": "3.1 3.1 Nil\n\n3.2 3.2 Nil", "action_required": "No Action", "observation_type": "Other"}', '2025-12-22 13:12:44.335933') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (235, 1, 'create_observation', 'observation', 20, '{"severity": "Minor", "component": "Davit arm", "inspection_id": 8, "observation_type": "Other"}', '2025-12-22 13:14:38.605724') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (236, 1, 'create_observation', 'observation', 21, '{"severity": "Minor", "component": "Shell", "inspection_id": 8, "observation_type": "Other"}', '2025-12-22 13:17:51.26651') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (237, 1, 'create_observation', 'observation', 22, '{"severity": "Minor", "component": "top dish", "inspection_id": 8, "observation_type": "Other"}', '2025-12-22 13:20:15.08058') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (238, 1, 'create_observation', 'observation', 23, '{"severity": "Minor", "component": "Nozzle", "inspection_id": 8, "observation_type": "Other"}', '2025-12-22 13:23:27.111214') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (239, 1, 'create_observation', 'observation', 24, '{"severity": "Minor", "component": "Pressure gauge", "inspection_id": 8, "observation_type": "Other"}', '2025-12-22 13:24:55.014477') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (243, 1, 'create_observation', 'observation', 27, '{"severity": "Minor", "component": "manhole", "inspection_id": 8, "observation_type": "Other"}', '2025-12-24 11:38:45.894717') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (244, 1, 'create_observation', 'observation', 28, '{"severity": "Minor", "component": "bottom dish head", "inspection_id": 8, "observation_type": "Other"}', '2025-12-24 11:40:58.553572') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (245, 1, 'create_observation', 'observation', 29, '{"severity": "Minor", "component": "bottom internal shell", "inspection_id": 8, "observation_type": "Other"}', '2025-12-24 11:43:13.742723') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (246, 1, 'create_observation', 'observation', 30, '{"severity": "Minor", "component": "cluster porosity", "inspection_id": 8, "observation_type": "Other"}', '2025-12-24 11:46:13.722085') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (247, 1, 'create_observation', 'observation', 31, '{"severity": "Minor", "component": "middle internal shell wall", "inspection_id": 8, "observation_type": "Other"}', '2025-12-24 11:49:28.001261') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (248, 1, 'create_observation', 'observation', 32, '{"severity": "Minor", "component": "top dish head", "inspection_id": 8, "observation_type": "Other"}', '2025-12-24 11:51:39.284255') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (249, 1, 'create_observation', 'observation', 33, '{"severity": "Minor", "component": "Nozzle", "inspection_id": 8, "observation_type": "Other"}', '2025-12-24 11:52:38.565419') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (250, 1, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2025-12-29T03:09:03.826Z", "login_method": "email"}', '2025-12-29 06:09:03.828214') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (251, 1, 'generate_report', 'inspection', 8, '{"filename": "Visual Inspection Report_V-001.pdf", "report_number": "PLANT/01/VR-001/TA2025"}', '2025-12-29 06:09:25.291689') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (252, 1, 'update_inspection', 'inspection', 8, '{"status": "submitted", "remarks": "", "due_date": "2025-12-30", "priority": "Medium", "vessel_id": 5, "scheduled_date": "2025-12-22", "inspection_date": "2025-12-22", "inspection_type": "Initial", "findings_summary": "", "next_inspection_date": "2027-12-22"}', '2025-12-29 06:14:35.435027') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (253, 1, 'update_inspection', 'inspection', 6, '{"status": "submitted", "remarks": "", "due_date": "2025-12-24", "priority": "Medium", "vessel_id": 5, "scheduled_date": "2025-12-05", "inspection_date": "2025-12-05", "inspection_type": "Initial", "findings_summary": "", "next_inspection_date": "2027-12-05"}', '2025-12-29 06:14:49.299434') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (254, 1, 'update_inspection', 'inspection', 6, '{"status": "under_review", "remarks": "", "due_date": "2025-12-24", "priority": "Medium", "vessel_id": 5, "scheduled_date": "2025-12-05", "inspection_date": "2025-12-05", "inspection_type": "Initial", "findings_summary": "", "next_inspection_date": "2027-12-05"}', '2025-12-29 06:14:57.012433') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (255, 1, 'update_inspection', 'inspection', 6, '{"status": "approved", "remarks": "", "due_date": "2025-12-24", "priority": "Medium", "vessel_id": 5, "scheduled_date": "2025-12-05", "inspection_date": "2025-12-05", "inspection_type": "Initial", "findings_summary": "", "next_inspection_date": "2027-12-05"}', '2025-12-29 06:15:04.303916') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (256, 1, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2025-12-31T13:12:03.259Z", "login_method": "email"}', '2025-12-31 16:12:03.260592') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (257, 1, 'update_vessel', 'vessel', 5, '{"tag_no": "V-001", "location": "Area A - Block 2", "plant_unit": "1", "description": "Test Pressure Vessel", "design_data": {"material": "Carbon Steal", "year_built": "2014", "manufacturer": "Fabrication", "design_pressure": "150 psi", "design_temperature": "450F"}, "vessel_type": "Reactor"}', '2025-12-31 16:22:58.79818') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (258, 1, 'update_vessel', 'vessel', 4, '{"tag_no": "S-401", "location": "Area D - Tank Farm", "plant_unit": "2", "description": "LPG Storage Sphere", "design_data": {"capacity": "10000 barrels", "diameter": "40 ft", "material": "Carbon Steel SA-516", "design_pressure": "250 psi", "design_temperature": "120°F"}, "vessel_type": "Sphere"}', '2025-12-31 16:23:06.784905') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (259, 1, 'update_vessel', 'vessel', 3, '{"tag_no": "HX-301", "location": "Area C - Block 5", "plant_unit": "3", "description": "Shell and Tube Heat Exchanger", "design_data": {"material": "Carbon Steel", "design_pressure": "200 psi", "design_temperature": "350°F", "heat_transfer_area": "500 sq ft"}, "vessel_type": "Heat Exchanger"}', '2025-12-31 16:23:13.915494') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (260, 1, 'update_vessel', 'vessel', 2, '{"tag_no": "R-201", "location": "Area B - Block 3", "plant_unit": "3", "description": "Catalytic Reactor", "design_data": {"volume": "5000 gallons", "material": "Stainless Steel 316L", "design_pressure": "300 psi", "design_temperature": "600°F"}, "vessel_type": "Reactor"}', '2025-12-31 16:23:20.774637') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (261, 1, 'generate_report', 'inspection', 8, '{"filename": "Visual Inspection Report_V-001.pdf", "report_number": "PLANT/01/VR-001/TA2025"}', '2025-12-31 16:23:48.372089') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (262, 1, 'create_inspection', 'inspection', 9, '{"priority": "Medium", "vessel_id": "4", "inspection_type": "Periodic"}', '2025-12-31 16:26:56.22924') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (263, 1, 'generate_report', 'inspection', 9, '{"filename": "Visual Inspection Report_S-401.pdf", "report_number": "PLANT 2/VI/S-401/TA2025"}', '2025-12-31 16:27:04.195894') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (264, 1, 'generate_report', 'inspection', 9, '{"filename": "Visual Inspection Report_S-401.pdf", "report_number": "PLANT 2/VI/S-401/TA2025"}', '2025-12-31 16:34:06.004278') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (265, 1, 'update_inspection', 'inspection', 8, '{"status": "submitted", "remarks": "", "due_date": "2025-12-30", "priority": "Medium", "vessel_id": 5, "scheduled_date": "2025-12-22", "inspection_date": "2025-12-22", "inspection_type": "Initial", "findings_summary": "", "next_inspection_date": "2027-12-22"}', '2025-12-31 16:55:45.930973') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (266, 1, 'update_inspection', 'inspection', 8, '{"status": "under_review", "remarks": "", "due_date": "2025-12-30", "priority": "Medium", "vessel_id": 5, "scheduled_date": "2025-12-22", "inspection_date": "2025-12-22", "inspection_type": "Initial", "findings_summary": "", "next_inspection_date": "2027-12-22"}', '2025-12-31 16:55:52.987503') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (267, 1, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2026-01-07T07:25:58.530Z", "login_method": "email"}', '2026-01-07 10:25:58.531875') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (268, 1, 'delete_inspection', 'inspection', 4, '{}', '2026-01-07 10:29:06.160064') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (269, 1, 'delete_inspection', 'inspection', 3, '{}', '2026-01-07 10:29:44.390281') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (270, 1, 'delete_inspection', 'inspection', 5, '{}', '2026-01-07 10:30:00.025474') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (271, 1, 'delete_observation', 'observation', 7, '{"component": "Nozzle", "inspection_id": 2, "observation_type": "Corrosion"}', '2026-01-07 10:30:19.860489') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (272, 1, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2026-01-07T07:30:47.057Z", "login_method": "email"}', '2026-01-07 10:30:47.058726') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (273, 1, 'reset_password', 'user', 3, '{"target_user": "Fahad Khalid Mohammed"}', '2026-01-07 10:33:47.795146') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (274, 1, 'update_user', 'user', 2, '{"name": "Mohammed Ali", "role": "inspector", "email": "mohammedali@ipetro.com", "username": "inspector01", "department": "Field Operations - Senior Team", "certification_id": "API-510-12345-UPDATED"}', '2026-01-07 10:34:13.552761') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (275, 1, 'update_user', 'user', 5, '{"name": "Ahmed", "role": "inspector", "email": "ahmed@ipetro.com", "username": "inspector02", "department": "Field Operations", "certification_id": "INS-10293u"}', '2026-01-07 10:34:43.804823') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (276, 1, 'update_report_status', 'inspection', 9, '{"status": "rejected", "review_comments": ""}', '2026-01-07 11:29:13.82908') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (277, 1, 'generate_report', 'inspection', 9, '{"filename": "Visual Inspection Report_S-401.pdf", "report_number": "PLANT 2/VI/S-401/TA2025"}', '2026-01-07 11:59:28.641706') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (315, 1, 'create_inspection', 'inspection', 11, '{"priority": "Medium", "vessel_id": 5, "inspection_type": "Initial"}', '2026-01-10 18:47:48.921024') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (278, 1, 'update_user', 'user', 1, '{"name": "Faisal Ahmed Mohammed Qaid", "email": "admin@ipetro.com", "username": "admin", "department": "Administration", "certification_id": ""}', '2026-01-07 14:56:58.638721') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (279, 1, 'update_report_status', 'inspection', 7, '{"status": "changes_requested", "review_comments": ""}', '2026-01-07 15:00:00.849908') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (280, 7, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2026-01-07T12:00:34.478Z", "login_method": "username"}', '2026-01-07 15:00:34.483089') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (281, 7, 'generate_report', 'inspection', 6, '{"filename": "Visual Inspection Report_V-001.pdf", "report_number": "PLANT/01/VR-V-001/TA2025"}', '2026-01-07 15:01:31.931798') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (282, 7, 'update_inspection', 'inspection', 6, '{"status": "approved", "remarks": "", "due_date": "2025-12-24", "priority": "Medium", "vessel_id": 5, "scheduled_date": "2025-12-05", "inspection_date": "2025-12-05", "inspection_type": "Initial", "findings_summary": "", "next_inspection_date": "2027-12-05"}', '2026-01-07 15:01:58.003413') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (283, 8, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2026-01-07T12:04:06.581Z", "login_method": "username"}', '2026-01-07 15:04:06.581757') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (284, 8, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2026-01-07T12:08:20.181Z", "login_method": "username"}', '2026-01-07 15:08:20.185352') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (285, 8, 'update_report_status', 'inspection', 8, '{"status": "rejected", "review_comments": ""}', '2026-01-07 15:09:58.618508') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (286, 8, 'update_report_status', 'inspection', 7, '{"status": "rejected", "review_comments": ""}', '2026-01-07 15:10:59.876376') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (287, 8, 'update_report_status', 'inspection', 7, '{"status": "approved", "review_comments": ""}', '2026-01-07 15:11:14.789737') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (288, 8, 'update_report_status', 'inspection', 7, '{"status": "rejected", "review_comments": ""}', '2026-01-07 15:11:31.699622') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (289, 1, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2026-01-07T12:19:18.860Z", "login_method": "email"}', '2026-01-07 15:19:18.861684') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (290, 7, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2026-01-07T12:20:42.672Z", "login_method": "username"}', '2026-01-07 15:20:42.679867') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (291, 8, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2026-01-07T12:21:05.163Z", "login_method": "username"}', '2026-01-07 15:21:05.171459') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (292, 8, 'update_report_status', 'inspection', 7, '{"status": "approved", "review_comments": ""}', '2026-01-07 15:21:54.338232') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (293, 8, 'update_report_status', 'inspection', 2, '{"status": "rejected", "review_comments": ""}', '2026-01-07 15:37:40.167169') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (294, 8, 'update_report_status', 'inspection', 2, '{"status": "changes_requested", "review_comments": ""}', '2026-01-07 15:38:12.782037') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (295, 1, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2026-01-07T12:38:40.147Z", "login_method": "username"}', '2026-01-07 15:38:40.150967') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (296, 7, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2026-01-07T12:38:51.725Z", "login_method": "username"}', '2026-01-07 15:38:51.729103') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (297, 8, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2026-01-07T12:39:50.805Z", "login_method": "username"}', '2026-01-07 15:39:50.810368') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (298, 1, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2026-01-07T12:52:38.605Z", "login_method": "username"}', '2026-01-07 15:52:38.606499') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (299, 1, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2026-01-07T13:00:55.760Z", "login_method": "username"}', '2026-01-07 16:00:55.76172') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (300, 1, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2026-01-10T10:09:33.704Z", "login_method": "username"}', '2026-01-10 13:09:33.704862') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (301, 1, 'update_inspection', 'inspection', 9, '{"status": "draft", "remarks": "", "due_date": "2026-01-10", "priority": "Medium", "vessel_id": 4, "scheduled_date": "2026-01-10", "inspection_date": "2025-12-31", "inspection_type": "Periodic", "findings_summary": "", "dosh_registration": "MK PMT 1003", "next_inspection_date": "2026-01-10"}', '2026-01-10 13:12:56.456874') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (302, 1, 'update_inspection', 'inspection', 9, '{"status": "draft", "remarks": "", "due_date": "2026-01-10", "priority": "Medium", "vessel_id": 4, "scheduled_date": "2026-01-10", "inspection_date": "2025-12-31", "inspection_type": "Periodic", "findings_summary": "", "dosh_registration": "MK PMT 1003", "next_inspection_date": "2026-01-10"}', '2026-01-10 13:16:12.136791') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (303, 1, 'update_inspection', 'inspection', 9, '{"status": "draft", "remarks": "", "due_date": "2026-01-10", "priority": "Medium", "vessel_id": 4, "scheduled_date": "2026-01-10", "inspection_date": "2025-12-31", "inspection_type": "Periodic", "findings_summary": "", "dosh_registration": "MK PMT 1003", "next_inspection_date": "2026-01-10"}', '2026-01-10 13:20:53.170115') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (304, 1, 'update_inspection', 'inspection', 9, '{"status": "draft", "remarks": "", "due_date": "2026-01-10", "priority": "Medium", "vessel_id": 4, "scheduled_date": "2026-01-10", "inspection_date": "2025-12-31", "inspection_type": "Periodic", "findings_summary": "", "dosh_registration": "MK PMT 1003", "next_inspection_date": "2026-01-10"}', '2026-01-10 13:21:10.112927') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (305, 1, 'update_inspection', 'inspection', 9, '{"status": "draft", "remarks": "", "due_date": "2026-01-10", "priority": "Medium", "vessel_id": 4, "scheduled_date": "2026-01-10", "inspection_date": "2025-12-31", "inspection_type": "Periodic", "findings_summary": "", "dosh_registration": "MK PMT 1003", "next_inspection_date": "2026-01-10"}', '2026-01-10 13:22:38.665098') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (306, 1, 'update_inspection', 'inspection', 9, '{"scope": null, "status": "draft", "remarks": "", "due_date": "2026-01-10", "priority": "Medium", "vessel_id": 4, "reviewer_id": null, "inspector_id": null, "scheduled_date": "2026-01-10", "inspection_date": "2025-12-31", "inspection_type": "Periodic", "findings_summary": "", "dosh_registration": "MK PMT 1003", "next_inspection_date": "2026-01-10"}', '2026-01-10 13:39:29.486862') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (307, 1, 'update_inspection', 'inspection', 9, '{"scope": null, "status": "draft", "remarks": "", "due_date": "2026-01-10", "priority": "Medium", "vessel_id": 4, "reviewer_id": null, "inspector_id": null, "scheduled_date": "2026-01-10", "inspection_date": "2025-12-31", "inspection_type": "Periodic", "findings_summary": "", "dosh_registration": "MK PMT 1003", "next_inspection_date": "2026-01-10"}', '2026-01-10 13:46:26.033147') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (308, 1, 'update_inspection', 'inspection', 9, '{"scope": null, "status": "draft", "remarks": "", "due_date": "2026-01-10", "priority": "Medium", "vessel_id": 4, "reviewer_id": null, "inspector_id": null, "scheduled_date": "2026-01-10", "inspection_date": "2025-12-31", "inspection_type": "Periodic", "findings_summary": "", "dosh_registration": "MK PMT 1003", "next_inspection_date": "2026-01-10"}', '2026-01-10 13:50:10.507401') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (309, 1, 'update_inspection', 'inspection', 8, '{"scope": null, "status": "under_review", "remarks": "", "due_date": "2025-12-30", "priority": "Medium", "vessel_id": 5, "reviewer_id": null, "inspector_id": null, "scheduled_date": "2025-12-22", "inspection_date": "2025-12-22", "inspection_type": "Initial", "findings_summary": "", "dosh_registration": "MK PMT 1002", "next_inspection_date": "2027-12-22"}', '2026-01-10 18:25:07.317421') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (310, 1, 'generate_report', 'inspection', 8, '{"filename": "Visual Inspection Report_V-001.pdf", "report_number": "PLANT/01/VR-001/TA2025"}', '2026-01-10 18:25:16.788127') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (311, 1, 'generate_report', 'inspection', 9, '{"filename": "Visual Inspection Report_S-401.pdf", "report_number": "PLANT 2/VI/S-401/TA2025"}', '2026-01-10 18:26:21.451749') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (312, 1, 'create_inspection', 'inspection', 10, '{"priority": "Medium", "vessel_id": 2, "inspection_type": "Initial"}', '2026-01-10 18:27:07.238979') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (313, 1, 'generate_report', 'inspection', 10, '{"filename": "Visual Inspection Report_R-201.pdf", "report_number": "PLANT 3/VI/R-201/TA2026"}', '2026-01-10 18:27:13.847097') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (314, 1, 'delete_inspection', 'inspection', 10, '{}', '2026-01-10 18:27:24.233414') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (316, 1, 'update_inspection', 'inspection', 9, '{"scope": null, "status": "draft", "remarks": "", "due_date": "2026-01-10", "priority": "Medium", "vessel_id": 4, "reviewer_id": null, "inspector_id": null, "scheduled_date": "2026-01-10", "inspection_date": "2025-12-31", "inspection_type": "Periodic", "findings_summary": "", "dosh_registration": "MK PMT 1003", "next_inspection_date": "2026-01-10"}', '2026-01-10 19:08:45.233938') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (317, 1, 'update_inspection', 'inspection', 11, '{"scope": null, "status": "draft", "remarks": "", "due_date": "", "priority": "Medium", "vessel_id": 5, "reviewer_id": null, "inspector_id": null, "scheduled_date": "", "inspection_date": "2026-01-10", "inspection_type": "Initial", "findings_summary": "", "dosh_registration": null, "next_inspection_date": ""}', '2026-01-10 19:09:05.491085') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (318, 1, 'update_inspection', 'inspection', 11, '{"scope": null, "status": "draft", "remarks": "", "due_date": "", "priority": "Medium", "vessel_id": 5, "reviewer_id": null, "inspector_id": null, "scheduled_date": "2026-01-29", "inspection_date": "2026-01-10", "inspection_type": "Initial", "findings_summary": "", "dosh_registration": null, "next_inspection_date": ""}', '2026-01-10 19:09:18.001435') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (319, 1, 'update_inspection', 'inspection', 11, '{"scope": null, "status": "draft", "remarks": "", "due_date": "", "priority": "Medium", "vessel_id": 5, "reviewer_id": null, "inspector_id": null, "scheduled_date": "", "inspection_date": "2026-01-12", "inspection_type": "Initial", "findings_summary": "", "dosh_registration": null, "next_inspection_date": ""}', '2026-01-10 19:09:45.257157') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (320, 1, 'create_inspection', 'inspection', 12, '{"priority": "Medium", "vessel_id": 5, "inspection_type": "Initial"}', '2026-01-10 19:09:58.399121') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (321, 1, 'delete_inspection', 'inspection', 12, '{}', '2026-01-10 19:10:03.926984') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (322, 1, 'delete_inspection', 'inspection', 11, '{}', '2026-01-10 19:10:05.837955') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (323, 1, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2026-01-13T17:20:12.164Z", "login_method": "username"}', '2026-01-13 20:20:12.166372') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (324, 1, 'delete_user', 'user', 2, '{"deleted_user": "Mohammed Ali"}', '2026-01-13 20:22:43.307037') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (325, 1, 'create_user', 'user', 9, '{"role": "admin", "email": "sh@gmail.com", "username": "sultan", "created_user": "sultan zayed"}', '2026-01-13 20:23:51.214126') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (326, 1, 'delete_user', 'user', 3, '{"deleted_user": "Fahad Khalid Mohammed"}', '2026-01-13 20:24:25.49191') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (327, 1, 'delete_user', 'user', 4, '{"deleted_user": "Faisal Ahmed"}', '2026-01-13 20:24:35.190861') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (328, 1, 'create_user', 'user', 10, '{"role": "inspector", "email": "oseid@ipetro.com", "username": "oseid", "created_user": "oseid abdulhakeem "}', '2026-01-13 20:25:28.298736') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (329, 1, 'create_user', 'user', 11, '{"role": "reviewer", "email": "hussein@gmail.com", "username": "hus", "created_user": "hussein "}', '2026-01-13 20:26:06.918044') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (330, 1, 'create_vessel', 'vessel', 8, '{"tag_no": "B-101", "vessel_type": "Bullet"}', '2026-01-13 20:28:14.720978') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (331, 1, 'delete_inspection', 'inspection', 9, '{}', '2026-01-13 20:28:53.338783') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (332, 1, 'delete_vessel', 'vessel', 4, '{"deleted_tag_no": "S-401", "deleted_vessel_type": "Sphere"}', '2026-01-13 20:29:02.793437') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (333, 9, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2026-01-13T17:29:35.918Z", "login_method": "username"}', '2026-01-13 20:29:35.919197') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (334, 10, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2026-01-13T17:29:53.219Z", "login_method": "email"}', '2026-01-13 20:29:53.220051') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (335, 11, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2026-01-13T17:40:46.718Z", "login_method": "username"}', '2026-01-13 20:40:46.720051') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (336, 10, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2026-01-13T17:41:06.517Z", "login_method": "username"}', '2026-01-13 20:41:06.519215') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (337, 10, 'create_inspection', 'inspection', 13, '{"priority": "Medium", "vessel_id": 2, "inspection_type": "Initial"}', '2026-01-13 22:18:54.086232') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (338, 10, 'create_observation', 'observation', 34, '{"severity": "Minor", "component": "General view", "inspection_id": 13, "observation_type": "Other"}', '2026-01-13 22:24:03.625791') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (339, 10, 'update_observation', 'observation', 34, '{"status": "Open", "location": "", "priority": "Low", "severity": "Minor", "component": "General view", "vessel_id": 2, "description": "1.1 General view of equipment R-001 facing plant north side. Equipment was found fully insulated. Insulation noted in serviceable condition.", "inspection_id": 13, "finding_number": "1", "recommendation": "1.1  Nil.", "action_required": "No Action", "observation_type": "Other"}', '2026-01-13 22:25:21.702605') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (340, 10, 'create_observation', 'observation', 35, '{"severity": "Minor", "component": "Nameplate", "inspection_id": 13, "observation_type": "Other"}', '2026-01-13 22:40:01.650339') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (341, 10, 'create_observation', 'observation', 36, '{"severity": "Minor", "component": "Concrete foundation", "inspection_id": 13, "observation_type": "Other"}', '2026-01-13 22:45:05.71434') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (342, 10, 'create_observation', 'observation', 37, '{"severity": "Minor", "component": "bottom dish head", "inspection_id": 13, "observation_type": "Other"}', '2026-01-13 22:47:29.785488') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (343, 10, 'create_observation', 'observation', 38, '{"severity": "Minor", "component": "Nozzle", "inspection_id": 13, "observation_type": "General Wear"}', '2026-01-13 22:48:10.369033') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (344, 10, 'create_observation', 'observation', 39, '{"severity": "Minor", "component": "Shell", "inspection_id": 13, "observation_type": "General Wear"}', '2026-01-13 22:48:53.394417') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (345, 10, 'create_observation', 'observation', 40, '{"severity": "Minor", "component": "top dish head", "inspection_id": 13, "observation_type": "General Wear"}', '2026-01-13 22:53:03.54057') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (346, 10, 'generate_report', 'inspection', 13, '{"filename": "Visual Inspection Report_R-201.pdf", "report_number": "PLANT 3/VI/R-201/TA2026"}', '2026-01-13 22:54:22.983821') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (347, 1, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2026-01-13T20:00:20.020Z", "login_method": "username"}', '2026-01-13 23:00:20.029848') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (348, 10, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2026-01-13T20:07:51.753Z", "login_method": "email"}', '2026-01-13 23:07:51.754096') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (349, 10, 'update_inspection', 'inspection', 13, '{"scope": null, "status": "submitted", "remarks": "", "due_date": "", "priority": "Medium", "vessel_id": 2, "reviewer_id": null, "inspector_id": null, "scheduled_date": "", "inspection_date": "2026-01-14", "inspection_type": "Initial", "findings_summary": "", "dosh_registration": "MK PMT 1001", "next_inspection_date": "2028-01-14"}', '2026-01-13 23:08:13.069244') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (350, 1, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2026-01-13T20:08:54.514Z", "login_method": "username"}', '2026-01-13 23:08:54.515436') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (351, 1, 'update_report_status', 'inspection', 13, '{"status": "changes_requested", "review_comments": ""}', '2026-01-13 23:11:18.462434') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (352, 1, 'update_inspection', 'inspection', 13, '{"scope": null, "status": "changes_requested", "remarks": "", "due_date": "", "priority": "Medium", "vessel_id": 2, "reviewer_id": null, "inspector_id": null, "scheduled_date": "", "inspection_date": "2026-01-14", "inspection_type": "Initial", "findings_summary": "", "dosh_registration": "MK PMT 1001", "next_inspection_date": "2028-01-14"}', '2026-01-13 23:11:38.078139') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (353, 10, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2026-01-13T20:11:51.117Z", "login_method": "email"}', '2026-01-13 23:11:51.120679') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (354, 10, 'create_inspection', 'inspection', 14, '{"priority": "Medium", "vessel_id": 8, "inspection_type": "Initial"}', '2026-01-13 23:22:09.194591') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (355, 10, 'update_inspection', 'inspection', 14, '{"scope": null, "status": "changes_requested", "remarks": "", "due_date": "", "priority": "Medium", "vessel_id": 8, "reviewer_id": null, "inspector_id": null, "scheduled_date": "", "inspection_date": "2026-01-14", "inspection_type": "Initial", "findings_summary": "", "dosh_registration": null, "next_inspection_date": ""}', '2026-01-13 23:22:20.3028') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (356, 10, 'create_inspection', 'inspection', 15, '{"priority": "Medium", "vessel_id": 8, "inspection_type": "Initial"}', '2026-01-13 23:56:25.609277') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (357, 10, 'update_inspection', 'inspection', 15, '{"scope": null, "status": "submitted", "remarks": "", "due_date": "", "priority": "Medium", "vessel_id": 8, "reviewer_id": null, "inspector_id": null, "scheduled_date": "", "inspection_date": "2026-01-14", "inspection_type": "Initial", "findings_summary": "", "dosh_registration": null, "next_inspection_date": ""}', '2026-01-13 23:56:50.067326') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (358, 10, 'update_inspection', 'inspection', 13, '{"scope": null, "status": "submitted", "remarks": "", "due_date": "", "priority": "Medium", "vessel_id": 2, "reviewer_id": null, "inspector_id": null, "scheduled_date": "", "inspection_date": "2026-01-14", "inspection_type": "Initial", "findings_summary": "", "dosh_registration": "MK PMT 1001", "next_inspection_date": "2028-01-14"}', '2026-01-14 00:00:35.83878') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (359, 10, 'delete_inspection', 'inspection', 15, '{}', '2026-01-14 00:00:41.170372') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (360, 10, 'update_inspection', 'inspection', 13, '{"scope": null, "status": "changes_requested", "remarks": "", "due_date": "", "priority": "Medium", "vessel_id": 2, "reviewer_id": null, "inspector_id": null, "scheduled_date": "", "inspection_date": "2026-01-14", "inspection_type": "Initial", "findings_summary": "", "dosh_registration": "MK PMT 1001", "next_inspection_date": "2028-01-14"}', '2026-01-14 00:00:58.380125') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (361, 10, 'update_inspection', 'inspection', 13, '{"scope": null, "status": "approved", "remarks": "", "due_date": "", "priority": "Medium", "vessel_id": 2, "reviewer_id": null, "inspector_id": null, "scheduled_date": "", "inspection_date": "2026-01-14", "inspection_type": "Initial", "findings_summary": "", "dosh_registration": "MK PMT 1001", "next_inspection_date": "2028-01-14"}', '2026-01-14 00:01:43.837118') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (362, 11, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2026-01-13T21:07:07.030Z", "login_method": "username"}', '2026-01-14 00:07:07.033617') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (363, 11, 'update_report_status', 'inspection', 13, '{"status": "approved", "review_comments": ""}', '2026-01-14 00:07:23.686376') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (364, 10, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2026-01-13T21:09:12.202Z", "login_method": "email"}', '2026-01-14 00:09:12.203315') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (365, 1, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2026-01-13T21:11:34.750Z", "login_method": "username"}', '2026-01-14 00:11:34.758114') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (366, 1, 'update_inspection', 'inspection', 14, '{"scope": null, "status": "draft", "remarks": "", "due_date": "", "priority": "Medium", "vessel_id": 8, "reviewer_id": null, "inspector_id": null, "scheduled_date": "", "inspection_date": "2026-01-14", "inspection_type": "Initial", "findings_summary": "", "dosh_registration": null, "next_inspection_date": ""}', '2026-01-14 00:12:27.159471') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (367, 1, 'delete_inspection', 'inspection', 14, '{}', '2026-01-14 00:12:41.427032') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (368, 1, 'archive_inspection', 'inspection', 6, '{}', '2026-01-14 00:13:42.473976') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (369, 1, 'delete_inspection', 'inspection', 7, '{}', '2026-01-14 00:14:03.437753') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (370, 1, 'delete_inspection', 'inspection', 2, '{}', '2026-01-14 00:14:16.154684') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (371, 1, 'generate_report', 'inspection', 13, '{"filename": "Visual Inspection Report_R-201.pdf", "report_number": "PLANT 3/VI/R-201/TA2026"}', '2026-01-14 00:14:47.136368') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (372, 1, 'update_inspection', 'inspection', 8, '{"scope": null, "status": "draft", "remarks": "", "due_date": "2025-12-30", "priority": "Medium", "vessel_id": 5, "reviewer_id": null, "inspector_id": null, "scheduled_date": "2025-12-22", "inspection_date": "2025-12-22", "inspection_type": "Initial", "findings_summary": "", "dosh_registration": "MK PMT 1002", "next_inspection_date": "2027-12-22"}', '2026-01-14 00:18:10.985829') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (373, 1, 'update_inspection', 'inspection', 8, '{"scope": null, "status": "submitted", "remarks": "", "due_date": "2025-12-30", "priority": "Medium", "vessel_id": 5, "reviewer_id": null, "inspector_id": null, "scheduled_date": "2025-12-22", "inspection_date": "2025-12-22", "inspection_type": "Initial", "findings_summary": "", "dosh_registration": "MK PMT 1002", "next_inspection_date": "2027-12-22"}', '2026-01-14 00:18:33.004218') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (374, 1, 'update_inspection', 'inspection', 8, '{"scope": null, "status": "submitted", "remarks": "", "due_date": "2025-12-30", "priority": "Medium", "vessel_id": 5, "reviewer_id": null, "inspector_id": null, "scheduled_date": "2025-12-22", "inspection_date": "2025-12-22", "inspection_type": "Initial", "findings_summary": "", "dosh_registration": "MK PMT 1002", "next_inspection_date": "2027-12-22"}', '2026-01-14 00:20:13.746552') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (375, 1, 'update_inspection', 'inspection', 8, '{"scope": null, "status": "under_review", "remarks": "", "due_date": "2025-12-30", "priority": "Medium", "vessel_id": 5, "reviewer_id": null, "inspector_id": null, "scheduled_date": "2025-12-22", "inspection_date": "2025-12-22", "inspection_type": "Initial", "findings_summary": "", "dosh_registration": "MK PMT 1002", "next_inspection_date": "2027-12-22"}', '2026-01-14 00:23:37.335862') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (376, 1, 'update_inspection', 'inspection', 8, '{"scope": null, "status": "changes_requested", "remarks": "", "due_date": "2025-12-30", "priority": "Medium", "vessel_id": 5, "reviewer_id": null, "inspector_id": null, "scheduled_date": "2025-12-22", "inspection_date": "2025-12-22", "inspection_type": "Initial", "findings_summary": "", "dosh_registration": "MK PMT 1002", "next_inspection_date": "2027-12-22"}', '2026-01-14 00:26:28.462372') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (377, 1, 'update_inspection', 'inspection', 8, '{"scope": null, "status": "under_review", "remarks": "", "due_date": "2025-12-30", "priority": "Medium", "vessel_id": 5, "reviewer_id": null, "inspector_id": null, "scheduled_date": "2025-12-22", "inspection_date": "2025-12-22", "inspection_type": "Initial", "findings_summary": "", "dosh_registration": "MK PMT 1002", "next_inspection_date": "2027-12-22"}', '2026-01-14 00:27:09.506023') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (378, 11, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2026-01-13T21:29:38.053Z", "login_method": "username"}', '2026-01-14 00:29:38.05694') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (379, 11, 'update_report_status', 'inspection', 8, '{"status": "rejected", "review_comments": "do it again with respectful to the API 510"}', '2026-01-14 00:31:39.563818') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (380, 11, 'update_report_status', 'inspection', 13, '{"status": "approved", "review_comments": "good job"}', '2026-01-14 00:32:34.154298') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (381, 10, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2026-01-13T21:33:02.988Z", "login_method": "email"}', '2026-01-14 00:33:02.990409') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (382, 1, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2026-01-13T21:34:03.183Z", "login_method": "email"}', '2026-01-14 00:34:03.185823') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (383, 1, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2026-01-14T12:33:41.503Z", "login_method": "username"}', '2026-01-14 15:33:41.50498') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (384, 1, 'generate_report', 'inspection', 13, '{"filename": "Visual Inspection Report_R-201.pdf", "report_number": "PLANT 3/VI/R-201/TA2026"}', '2026-01-14 15:34:14.528832') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (385, 1, 'generate_report', 'inspection', 13, '{"filename": "Visual Inspection Report_R-201.pdf", "report_number": "PLANT 3/VI/R-201/TA2026"}', '2026-01-14 15:48:06.287063') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (386, 1, 'generate_report', 'inspection', 13, '{"filename": "Visual Inspection Report_R-201.pdf", "report_number": "PLANT 3/VI/R-201/TA2026"}', '2026-01-14 15:56:49.926158') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (387, 1, 'generate_report', 'inspection', 8, '{"filename": "Visual Inspection Report_V-001.pdf", "report_number": "PLANT/01/VR-001/TA2025"}', '2026-01-14 15:57:21.87421') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (388, 1, 'generate_report', 'inspection', 13, '{"filename": "Visual Inspection Report_R-201.pdf", "report_number": "PLANT 3/VI/R-201/TA2026"}', '2026-01-14 15:59:55.400483') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (389, 1, 'generate_report', 'inspection', 13, '{"filename": "Visual Inspection Report_R-201.pdf", "report_number": "PLANT 3/VI/R-201/TA2026"}', '2026-01-14 16:02:14.462415') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (390, 11, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2026-01-14T13:03:08.634Z", "login_method": "username"}', '2026-01-14 16:03:08.634657') ON CONFLICT DO NOTHING;
INSERT INTO public.activity_logs VALUES (391, 1, 'login', 'auth', NULL, '{"ip": "::1", "timestamp": "2026-01-14T13:21:35.774Z", "login_method": "username"}', '2026-01-14 16:21:35.775917') ON CONFLICT DO NOTHING;


--
-- TOC entry 3620 (class 0 OID 57393)
-- Dependencies: 240
-- Data for Name: ai_report_analysis; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.ai_report_analysis VALUES (1, 6, 26, 'F', '{"clarity": {"score": 8, "feedback": "The report generally follows a logical structure and uses professional language. Findings are clearly described individually. However, the report contains significant ambiguities due to the contradictory UTTM results and the inappropriate recommendations for critical findings. The photo report section is poorly organized, with redundant and confusing entries for findings and recommendations, which detracts from overall clarity.", "max_score": 15, "met_criteria": ["Findings clearly described", "Report follows logical structure", "Professional language used"], "missed_criteria": ["No ambiguous statements", "Proper formatting maintained"]}, "completeness": {"score": 10, "feedback": "The report includes basic vessel details, findings, NDTs, and recommendations. However, it lacks crucial equipment specifications such as design parameters (pressure, temperature), material, and previous inspection dates. The ''Inspected by'', ''Reviewed by'', and ''Approved by'' signature fields are mostly blank, which is a major omission for accountability. The photo report section has significant errors in linking findings and recommendations, with redundant and incorrect entries. The context mentions ''Total Photos: 3'' but only ''Photo 1'' and ''Photo 2'' are referenced in the report content, indicating a discrepancy or missing information. The ''Initial/Pre-Inspection - Not applicable'' for a major turnaround is unusual and lacks explanation.", "max_score": 25, "met_criteria": ["All required sections are present (vessel details, findings, observations)", "All findings have descriptions", "Recommendations provided for critical/major findings"], "missed_criteria": ["Equipment specifications documented", "Photos are linked to relevant observations"]}, "actionability": {"score": 3, "feedback": "While specific action items are stated, their appropriateness and implied priority levels are severely flawed, particularly for critical defects like through-wall corrosion. Recommending ''monitoring'' for an active leak risk is not actionable in a safe manner. Priority levels are not explicitly assigned. Next inspection dates are vague (''next major turnaround'', ''next scheduled inspection'') rather than specific. The lack of completed signature fields for ''Reviewed by'', ''Approved by'', and ''DOSH Officer'' significantly hinders the identification of responsible parties and the overall accountability for actions.", "max_score": 10, "met_criteria": ["Specific recommendations provided", "Action items clearly stated"], "missed_criteria": ["Priority levels clearly assigned", "Next inspection date specified", "Responsible parties identifiable"]}, "technical_accuracy": {"score": 5, "feedback": "This is the most critical failing of the report. The severity levels assigned to findings are inconsistent with the recommendations. Specifically, ''Through-wall corrosion detected with active leak or imminent failure risk'' (Finding 2.1) is a critical defect requiring immediate shutdown and repair, yet the recommendation is to ''Continue monitoring during routine inspections''. This is a severe safety hazard and technically unsound. Furthermore, the UTTM result stating ''No significant wall loss detected compared to nominal thickness'' directly contradicts the visual findings of ''Through-wall corrosion'' (1.1, 2.1) and ''Severe corrosion with significant metal loss exceeding 3mm depth'' (2.2). This fundamental inconsistency undermines the entire inspection and raises serious questions about the validity of the data or the inspection process itself. The recommendation for ''Severe corrosion with significant metal loss exceeding 3mm depth'' (2.2) to ''Monitor on next scheduled inspection, no immediate action required'' is also questionable without knowing the nominal thickness and remaining wall thickness calculations.", "max_score": 30, "met_criteria": ["Correct technical terminology used"], "missed_criteria": ["Severity levels appropriately assigned", "Measurements and data properly recorded", "NDT/inspection methods correctly documented"]}, "photo_documentation": {"score": 0, "feedback": "No actual photos were provided in the report content, making it impossible to evaluate their clarity, lighting, annotations, or how well they support the findings. The report only contains text descriptions of what the photo sections should contain. The linking of findings to photos within the photo report section is also flawed with copy-paste errors, further reducing its utility.", "max_score": 20, "met_criteria": ["Photo tags/numbers properly referenced"], "missed_criteria": ["Photos are clear and well-lit", "Relevant areas properly annotated", "Photos support the findings described", "Adequate photo coverage of equipment"]}}', '{"Clear identification of equipment via tag number and description.","Structured report format with distinct sections for findings, NDT, and recommendations.","Use of specific technical terminology for describing corrosion types and locations.","Attempt to link findings to recommendations (though the quality of recommendations is poor)."}', '{"**Address Critical Safety Hazards Immediately:** The recommendation to ''Continue monitoring'' for ''Through-wall corrosion detected with active leak or imminent failure risk'' (Finding 2.1) is unacceptable and poses an extreme safety risk. This requires immediate shutdown, isolation, and repair.","**Resolve Contradictions:** The UTTM statement (''No significant wall loss detected'') directly contradicts findings of ''Through-wall corrosion'' and ''Severe corrosion with significant metal loss exceeding 3mm depth.'' This fundamental inconsistency must be investigated and resolved.","**Complete Documentation:** All signature fields (Inspected by, Reviewed by, Approved by, DOSH Officer, Plant 1 Action) must be completed. Provide detailed equipment specifications (design parameters, last inspection, next due date).","**Improve Photo Documentation:** Actual photos must be included, clear, well-lit, annotated, and accurately linked to *specific* findings without redundancy or copy-paste errors in the photo report section. Clarify the discrepancy in the total number of photos.","**Enhance Actionability and Prioritization:** Assign clear priority levels to recommendations (e.g., Immediate, Urgent, Scheduled) and provide specific timelines or dates for actions and next inspections. Ensure recommendations are appropriate for the severity of the findings."}', 'This inspection report is critically flawed and inadequate for ensuring the safe operation of the pressure vessel. The most severe issue is the recommendation to ''continue monitoring'' for through-wall corrosion with an active leak risk, which represents an extreme safety hazard. This, coupled with a direct contradiction between visual findings (through-wall corrosion, significant metal loss) and NDT results (no significant wall loss), indicates a fundamental breakdown in the inspection process or reporting accuracy. The report also suffers from significant incompleteness, particularly regarding detailed equipment specifications and the absence of crucial signatures, which undermines accountability. The photo documentation is entirely missing, and the photo-finding linkage within the report is poorly executed. This report is unacceptable and requires immediate re-evaluation, corrective actions, and a thorough review of the inspection procedures and personnel competency.', 1, '2025-12-13 04:51:29.305986', '2025-12-13 04:51:29.305986', 'rubric') ON CONFLICT DO NOTHING;
INSERT INTO public.ai_report_analysis VALUES (5, 8, 88, 'B', '{"clarity": {"score": 14, "feedback": "The report is very clear and well-organized. It follows a logical structure, making it easy to read and understand the vessel''s condition. Findings are described concisely with precise locations and dimensions. The language used is professional, and the formatting is consistent throughout.", "max_score": 15, "met_criteria": ["Findings clearly described", "Report follows logical structure", "No ambiguous statements", "Professional language used", "Proper formatting maintained"], "missed_criteria": []}, "completeness": {"score": 24, "feedback": "The report is highly complete, covering all essential sections from vessel details to findings, NDTs, and recommendations. The detailed findings are well-described, and the photo report effectively links visual evidence to specific observations. All equipment specifications are documented, and recommendations are provided for all noted findings requiring future attention.", "max_score": 25, "met_criteria": ["All required sections are present (vessel details, findings, observations)", "Equipment specifications documented", "All findings have descriptions", "Photos are linked to relevant observations", "Recommendations provided for critical/major findings"], "missed_criteria": []}, "actionability": {"score": 6, "feedback": "While recommendations are provided for the identified defects (e.g., ''To be monitored on next opportunity''), they lack specificity. The report does not define *how* these items should be monitored (e.g., specific NDT, visual inspection frequency), nor does it assign explicit priority levels or a specific next inspection date. This reduces the immediate actionability and clarity for follow-up actions.", "max_score": 10, "met_criteria": ["Specific recommendations provided"], "missed_criteria": ["Priority levels clearly assigned", "Next inspection date specified", "Action items clearly stated", "Responsible parties identifiable"]}, "technical_accuracy": {"score": 25, "feedback": "The report demonstrates good technical accuracy. Correct terminology is generally used, and measurements (lengths, depths, radial projections) are properly recorded for defects. The assessment of ''no further defect propagation'' compared to previous reports is valuable. NDT methods (UTTM, DPT) are correctly documented. However, the report could be strengthened by explicitly referencing relevant industry codes (e.g., API 510) and their acceptance criteria for the noted defects (e.g., what constitutes ''acceptable'' porosity or mechanical marks).", "max_score": 30, "met_criteria": ["Correct technical terminology used", "Severity levels appropriately assigned", "Measurements and data properly recorded", "NDT/inspection methods correctly documented"], "missed_criteria": ["Compliance references accurate"]}, "photo_documentation": {"score": 19, "feedback": "The photo documentation is excellent. Each photo is clearly referenced to specific findings, and the descriptions accompanying the photos are detailed and support the main report''s observations. The numbering and linking system is effective, and the stated total number of photos suggests comprehensive coverage of the equipment.", "max_score": 20, "met_criteria": ["Photos are clear and well-lit", "Relevant areas properly annotated", "Photos support the findings described", "Adequate photo coverage of equipment", "Photo tags/numbers properly referenced"], "missed_criteria": []}}', '{"Clear and well-structured reporting format, making it easy to navigate and understand.","Detailed descriptions of findings, including dimensions, locations, and references to previous inspection reports for defect propagation.","Excellent photo documentation with clear links to specific findings and comprehensive descriptions.","Inclusion of NDT methods (UTTM, DPT) and their results, adding to the technical depth.","Professional language and consistent formatting throughout the report."}', '{"Recommendations should be more specific, detailing *how* defects are to be monitored (e.g., specific NDT, visual inspection) and at what frequency/interval.","Explicit priority levels (e.g., critical, major, minor) should be assigned to recommendations to guide maintenance planning.","The report would benefit from referencing relevant industry codes (e.g., API 510) and their acceptance criteria for the identified defects.","Specify a concrete next inspection date or interval rather than ''next opportunity'' for monitored items.","Ensure consistency in photo numbering (e.g., Photo 11 skipped 11.2 in its findings list)."}', 'This pressure vessel inspection report is of good quality, demonstrating a strong foundation in comprehensive reporting and detailed observation. Its strengths lie in its clear structure, meticulous documentation of findings with dimensions and locations, and particularly in its well-organized and descriptive photo report. The inclusion of NDT results and comparison to previous inspection data adds significant value. However, the report''s actionability is its primary area for improvement; recommendations are somewhat vague, lacking specific monitoring methods, explicit priority levels, or defined re-inspection intervals. Addressing these points would elevate the report to an excellent standard, providing clearer guidance for future maintenance and integrity management.', 1, '2025-12-29 06:11:15.545929', '2025-12-29 06:11:15.545929', 'rubric') ON CONFLICT DO NOTHING;
INSERT INTO public.ai_report_analysis VALUES (7, 13, 45, 'F', '{"clarity": {"score": 8, "feedback": "The report''s organization is confusing, with ''FINDINGS, NDTs & RECOMMENDATIONS'' presented separately from a ''PHOTOS REPORT'' which also contains findings and recommendations. This disjointed structure makes it difficult to follow. Statements like ''discoloration'' and ''no significant wall loss'' are ambiguous without further detail or quantitative data. The ''Condition'' prompt asks for specific details (e.g., active/inactive corrosion), but the findings do not directly address these, leading to a lack of clarity regarding the actual state of the vessel. Professional language is used, but overall formatting is inconsistent due to the fragmented structure.", "max_score": 15, "met_criteria": ["Professional language used"], "missed_criteria": ["Findings clearly described", "Report follows logical structure", "No ambiguous statements", "Proper formatting maintained"]}, "completeness": {"score": 10, "feedback": "The report is incomplete in several critical areas. While basic sections are present, crucial equipment specifications like design parameters, last inspection date, and next inspection date are missing. The ''FINDINGS'' section fails to provide detailed descriptions as prompted by the ''Condition'' section (e.g., type, extent, activity of corrosion/discoloration). The recommendation (1.7) is poorly linked to any specific finding in the main findings section, and 4 out of 11 total photos are not described or linked. The report lacks an overall fitness-for-service statement.", "max_score": 25, "met_criteria": ["All required sections are present (vessel details, findings, observations)", "All findings have descriptions"], "missed_criteria": ["Equipment specifications documented", "Photos are linked to relevant observations", "Recommendations provided for critical/major findings"]}, "actionability": {"score": 3, "feedback": "The report provides only one recommendation (1.7), which is vague (''perform surface preparation and apply protective coating or replace...'') and poorly linked to any specific finding in the main report. It''s unclear what problem this recommendation is addressing. No priority levels, timelines, or responsible parties are explicitly assigned to the recommendation. Crucially, the report fails to specify the next inspection date, which is a fundamental requirement for any inspection report, especially after a major turnaround.", "max_score": 10, "met_criteria": ["Action items clearly stated"], "missed_criteria": ["Specific recommendations provided", "Priority levels clearly assigned", "Next inspection date specified", "Responsible parties identifiable"]}, "technical_accuracy": {"score": 11, "feedback": "Technical accuracy is severely compromised by critical inconsistencies: the DOSH registration number changes between the main report (MK PMT 1001) and the photo report (MK PMT 1002), and the Plant/Unit/Area changes from ''Plant 3'' to ''Plant 1''. These are fundamental errors. No severity levels are assigned to findings. UTTM results are qualitative (''No significant wall loss'') rather than providing quantitative measurements (e.g., minimum thickness, comparison to previous readings). The report date (13 Jan 2026) is inconsistent with ''MAJOR TURNAROUND 2025''.", "max_score": 30, "met_criteria": ["Correct technical terminology used"], "missed_criteria": ["Severity levels appropriately assigned", "Measurements and data properly recorded", "Compliance references accurate", "NDT/inspection methods correctly documented"]}, "photo_documentation": {"score": 13, "feedback": "While photos are referenced by number, the report states ''Total Photos: 11'' but only describes 7. This indicates missing photo documentation. Crucially, there is no specific photo linked to the internal ''discoloration'' finding (2.6), which is the only potentially adverse internal condition noted. No annotations are mentioned, which would significantly improve clarity and support findings. Photos primarily support ''satisfactory'' conditions rather than highlighting specific issues.", "max_score": 20, "met_criteria": ["Photos are clear and well-lit", "Photo tags/numbers properly referenced"], "missed_criteria": ["Relevant areas properly annotated", "Photos support the findings described", "Adequate photo coverage of equipment"]}}', '{"Basic equipment identification details (tag, description) are present.","NDT (UTTM) was performed and referenced, indicating a level of technical assessment.","General external condition observations are documented, providing some overview of the vessel''s exterior.","Professional language is used throughout the report."}', '{"**Resolve Critical Data Inconsistencies:** Immediately correct the conflicting DOSH registration numbers and Plant/Unit/Area details across the report sections to ensure accuracy and traceability.","**Enhance Detail and Specificity in Findings:** Provide comprehensive, quantitative descriptions for all findings, especially internal conditions. Address all points outlined in the ''Condition'' prompt (e.g., type, extent, activity of discoloration/corrosion, measurements of defects).","**Consolidate and Structure the Report Logically:** Merge the ''FINDINGS, NDTs & RECOMMENDATIONS'' section with the ''PHOTOS REPORT'' into a single, cohesive document. All findings, NDT results, and recommendations should be presented in a unified and easy-to-follow format.","**Improve Photo Documentation and Linkage:** Ensure all mentioned photos are present and clearly linked to specific findings. Critical observations, such as internal discoloration, must be supported by clear, annotated photographs. Provide quantitative UTTM data.","**Strengthen Recommendations and Actionability:** Provide specific, prioritized recommendations directly linked to identified findings. Include clear action items, responsible parties, timelines, and, most importantly, the next scheduled inspection date."}', 'This inspection report for the Catalytic Reactor R-201 is significantly deficient and falls well below the expected standards for a major turnaround. It is plagued by critical data inconsistencies, a disjointed and confusing structure, and a severe lack of detail in its findings. While some general observations are made, crucial information regarding internal conditions, quantitative NDT data, and specific defect descriptions (as prompted by the report''s own template) is missing. The single recommendation provided is vague, poorly linked to any specific finding, and lacks prioritization or timelines. The absence of a clear overall assessment, fitness-for-service statement, and next inspection date renders the report largely unactionable and unreliable for effective asset management and regulatory compliance. Substantial revisions and a more rigorous inspection and reporting process are urgently required to bring this report to a satisfactory and useful level.', 1, '2026-01-13 23:09:32.067197', '2026-01-13 23:09:32.067197', 'rubric') ON CONFLICT DO NOTHING;
INSERT INTO public.ai_report_analysis VALUES (8, 13, 61, 'D', '{"clarity": {"score": 12, "feedback": "The report generally uses professional language and follows a logical structure with clear headings. Findings are mostly clearly described. However, the description of ''discoloration'' is somewhat ambiguous without further detail on its nature, extent, or potential cause. The repetitive header information on each ''PHOTOS REPORT'' page also indicates a minor formatting issue that could be streamlined.", "max_score": 15, "met_criteria": ["Findings clearly described", "Report follows logical structure", "Professional language used"], "missed_criteria": ["No ambiguous statements", "Proper formatting maintained"]}, "completeness": {"score": 14, "feedback": "The report includes most required sections, such as vessel details, findings, NDTs, and recommendations. Equipment specifications are documented, and all findings have descriptions. However, there is a critical inconsistency in the equipment details (Plant/Unit/Area and DOSH registration numbers) between the main report and the photo report sections, which significantly impacts completeness and reliability. Furthermore, the main internal findings (2.3-2.6) are not linked to any specific photos, and recommendations are only provided for one minor finding, not for all observations that might warrant monitoring or future action. The next inspection date is also missing.", "max_score": 25, "met_criteria": ["All required sections are present (vessel details, findings, observations)", "Equipment specifications documented", "All findings have descriptions"], "missed_criteria": ["Photos are linked to relevant observations", "Recommendations provided for critical/major findings"]}, "actionability": {"score": 3, "feedback": "Only one specific recommendation (1.7) is provided, and it is clearly stated. However, no priority levels are assigned to this or any other potential recommendations. Crucially, the report fails to specify the next inspection date, which is vital for planning and compliance. While fields for ''Action taken by Plant 1'' and ''Recommendation/Comment by DOSH Officer'' exist, responsible parties for implementing the recommendation are not explicitly identified within the report''s recommendation section.", "max_score": 10, "met_criteria": ["Specific recommendations provided", "Action items clearly stated"], "missed_criteria": ["Priority levels clearly assigned", "Next inspection date specified", "Responsible parties identifiable"]}, "technical_accuracy": {"score": 18, "feedback": "Correct technical terminology is generally used throughout the report. NDT methods (UTTM) are correctly documented and referenced. However, severity levels are not assigned to any findings, and specific measurements or quantitative data are largely absent, with the UTTM report only referenced and not summarized or included. The most significant technical inaccuracy is the inconsistency in the DOSH registration numbers (MK PMT 1001 vs MK PMT 1002) and Plant/Unit/Area (Plant 3 vs Plant 1) across different parts of the report, which is a fundamental error in identifying the inspected asset.", "max_score": 30, "met_criteria": ["Correct technical terminology used", "NDT/inspection methods correctly documented"], "missed_criteria": ["Severity levels appropriately assigned", "Measurements and data properly recorded", "Compliance references accurate"]}, "photo_documentation": {"score": 14, "feedback": "Based on the descriptions, the photo tags/numbers are properly referenced, and the findings described in the photo section are supported by the implied images. The descriptions for each photo are clear. However, without the actual photos, it''s impossible to assess clarity, lighting, or if relevant areas were properly annotated. More importantly, the main internal findings (2.3-2.6) lack any corresponding photo references, reducing the overall effectiveness of photo documentation for critical internal observations. The total number of photos (7) might also be considered minimal for a comprehensive reactor inspection.", "max_score": 20, "met_criteria": ["Photos support the findings described", "Photo tags/numbers properly referenced"], "missed_criteria": ["Photos are clear and well-lit", "Relevant areas properly annotated", "Adequate photo coverage of equipment"]}}', '{"The report follows a standard, logical structure with clear sections for vessel details, findings, NDT, and recommendations.","Professional and clear language is used throughout the report, making it generally easy to read and understand.","NDT (UTTM) is referenced, indicating that appropriate inspection techniques were considered.","The photo report section provides clear descriptions for each depicted area, aiding in understanding the visual observations.","A specific recommendation is provided for the identified discoloration, outlining a clear action for that particular finding."}', '{"**Resolve Inconsistent Equipment Identification:** The most critical issue is the conflicting Plant/Unit/Area and DOSH registration numbers between the main report and the photo report sections. This must be corrected to ensure the report pertains to a single, identifiable asset.","**Enhance Finding Detail and Severity Assessment:** Provide more specific details for findings like ''discoloration'' (e.g., type, extent, location, estimated severity). Implement a system for assigning severity levels to all findings (e.g., minor, moderate, critical).","**Improve Photo-Finding Linkage:** Directly link photos to the main internal findings (2.3-2.6) to provide visual evidence for these observations. Ensure all significant findings have corresponding photographic documentation.","**Strengthen Actionability:** Assign priority levels to recommendations, specify the next inspection date, and clearly identify responsible parties for implementing recommended actions. Consider providing recommendations for ''satisfactory'' items that may require future monitoring.","**Include NDT Details:** While UTTM is referenced, a summary of its findings (e.g., minimum thickness, corrosion rates, comparison to previous readings) should be included or the full report appended to provide a complete picture of the vessel''s integrity."}', 'This inspection report presents a foundational structure for documenting vessel inspections, utilizing professional language and including essential sections. However, its overall quality is significantly hampered by critical inconsistencies in equipment identification (Plant/Unit/Area and DOSH numbers) across different report sections, which fundamentally undermines its reliability. While findings are generally described, they often lack the specificity, quantitative data, and severity assessments necessary for robust integrity management. The linkage between the main findings and photo documentation is weak, and the actionability of the report is limited by the absence of priority levels, future inspection dates, and clear assignment of responsibility for recommendations. To be considered a reliable and effective inspection document, substantial improvements in data consistency, detail, and action-oriented planning are required.', 11, '2026-01-14 00:08:04.075807', '2026-01-14 00:08:04.075807', 'rubric') ON CONFLICT DO NOTHING;


--
-- TOC entry 3616 (class 0 OID 41182)
-- Dependencies: 236
-- Data for Name: finding_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.finding_templates VALUES (1, 'Corrosion', 'Minor', 'External corrosion detected on shell surface, localized area approximately 50mm x 50mm with minimal metal loss', true, NULL, '2025-11-22 08:56:20.694928') ON CONFLICT DO NOTHING;
INSERT INTO public.finding_templates VALUES (2, 'Corrosion', 'Moderate', 'General corrosion observed with pitting depth up to 2mm across affected area', true, NULL, '2025-11-22 08:56:20.694928') ON CONFLICT DO NOTHING;
INSERT INTO public.finding_templates VALUES (3, 'Corrosion', 'Major', 'Severe corrosion with significant metal loss exceeding 3mm depth', true, NULL, '2025-11-22 08:56:20.694928') ON CONFLICT DO NOTHING;
INSERT INTO public.finding_templates VALUES (4, 'Corrosion', 'Critical', 'Through-wall corrosion detected with active leak or imminent failure risk', true, NULL, '2025-11-22 08:56:20.694928') ON CONFLICT DO NOTHING;
INSERT INTO public.finding_templates VALUES (5, 'Cracking', 'Minor', 'Hairline surface crack detected, length < 25mm, no propagation evidence', true, NULL, '2025-11-22 08:56:20.694928') ON CONFLICT DO NOTHING;
INSERT INTO public.finding_templates VALUES (6, 'Cracking', 'Major', 'Crack detected in weld seam, length > 50mm, requires immediate attention', true, NULL, '2025-11-22 08:56:20.694928') ON CONFLICT DO NOTHING;
INSERT INTO public.finding_templates VALUES (7, 'Cracking', 'Critical', 'Through-wall crack with active leak, immediate shutdown required', true, NULL, '2025-11-22 08:56:20.694928') ON CONFLICT DO NOTHING;
INSERT INTO public.finding_templates VALUES (8, 'Deformation', 'Minor', 'Minor dent observed, depth < 5mm, no structural concern', true, NULL, '2025-11-22 08:56:20.694928') ON CONFLICT DO NOTHING;
INSERT INTO public.finding_templates VALUES (9, 'Deformation', 'Moderate', 'Dent observed with depth 5-10mm, monitoring required', true, NULL, '2025-11-22 08:56:20.694928') ON CONFLICT DO NOTHING;
INSERT INTO public.finding_templates VALUES (10, 'Deformation', 'Major', 'Significant deformation affecting structural integrity', true, NULL, '2025-11-22 08:56:20.694928') ON CONFLICT DO NOTHING;
INSERT INTO public.finding_templates VALUES (11, 'Pitting', 'Minor', 'Isolated pitting observed, depth < 1mm', true, NULL, '2025-11-22 08:56:20.694928') ON CONFLICT DO NOTHING;
INSERT INTO public.finding_templates VALUES (12, 'Pitting', 'Moderate', 'Multiple pits detected, maximum depth 1-2mm', true, NULL, '2025-11-22 08:56:20.694928') ON CONFLICT DO NOTHING;
INSERT INTO public.finding_templates VALUES (13, 'Pitting', 'Major', 'Severe pitting with depths exceeding 2mm', true, NULL, '2025-11-22 08:56:20.694928') ON CONFLICT DO NOTHING;
INSERT INTO public.finding_templates VALUES (14, 'Leakage', 'Critical', 'Active leak detected from vessel body/connection', true, NULL, '2025-11-22 08:56:20.694928') ON CONFLICT DO NOTHING;
INSERT INTO public.finding_templates VALUES (15, 'Mechanical Damage', 'Minor', 'Surface scratch or minor mechanical mark, no depth', true, NULL, '2025-11-22 08:56:20.694928') ON CONFLICT DO NOTHING;
INSERT INTO public.finding_templates VALUES (16, 'Mechanical Damage', 'Moderate', 'Mechanical damage with measurable depth < 1mm', true, NULL, '2025-11-22 08:56:20.694928') ON CONFLICT DO NOTHING;
INSERT INTO public.finding_templates VALUES (17, 'Weld Defect', 'Major', 'Weld defect detected requiring repair', true, NULL, '2025-11-22 08:56:20.694928') ON CONFLICT DO NOTHING;
INSERT INTO public.finding_templates VALUES (18, 'Coating Damage', 'Minor', 'Localized coating damage, substrate not exposed', true, NULL, '2025-11-22 08:56:20.694928') ON CONFLICT DO NOTHING;
INSERT INTO public.finding_templates VALUES (19, 'Coating Damage', 'Moderate', 'Coating failure with metal exposure, corrosion not active', true, NULL, '2025-11-22 08:56:20.694928') ON CONFLICT DO NOTHING;


--
-- TOC entry 3622 (class 0 OID 57434)
-- Dependencies: 242
-- Data for Name: findings_summary; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.findings_summary VALUES (2, 6, 5, 'Not applicable ', 'All internal attachment and internal nozzles were found securely intact with no visible defect.
Nozzles N-2 and N-15 flange included its gasket seat area found in satisfactory condition.', '[]', '[]', 'UTTM: No significant wall lost detected compared to nominal thickness. Please refer attachment report.', '[]', 1, '2025-12-22 12:44:46.28209', '2025-12-22 12:49:34.909855') ON CONFLICT DO NOTHING;
INSERT INTO public.findings_summary VALUES (3, 8, 5, 'Not applicable', '', '[{"text": "Generally, equipment was found fully painted. All associate parts noted securely intact in its position."}, {"text": "Nameplate, PMT number and equipment number were found secured in its place and legible."}, {"text": "Concrete foundation, support legs and anchor bolts observed in satisfactory condition with no sign of abnormalities."}, {"text": "Bottom and top dish head noted in satisfactory condition. No significant abnormalities observed."}, {"text": "Equipment shell externally noted in satisfactory condition with external coating noted intact properly on all equipment surfaces."}, {"text": "Davit arm, man hole and its cover were noted in serviceable condition with no evidence of significant damage."}, {"text": "All attachment nozzles, pressure gauge and lifting lug observed in satisfactory condition. No sign of anomaly seen."}]', '[{"text": "Manhole cover noted with evidence of scratch mark on gasket seat area at 7 o''clock position."}, {"text": "Manhole flange was found in serviceable condition except for evidence of mechanical mark on gasket seat area at position 1 o''clock with approx. 3mm of maximum of radial projection. No further defect propagation compared to previous report."}, {"text": "Evidence of mechanical mark with length approx. 40mm and < 0.5mm depth on 6 o''clock and mechanical mark with length approx. 5mm and < 0.5mm depth on 12 o''clock section of manhole neck."}, {"text": "Top and bottom dish head observed in satisfactory condition with no sign of deterioration (as seen via bottom head)."}, {"text": "Bottom internal shell wall observed in satisfactory with no sign of anomaly. All internal circumferential seam and longitudinal seam observed in good profile with no sign of relevant defect except for two locations of cluster porosity noted at CW1 and LW1B. DPT was performed and found acceptable previously. No further defect propagation compared to previous report."}, {"text": "Middle internal shell wall observed in satisfactory with no sign of anomaly (where seen and accessible)."}, {"text": "All attachment nozzles internally observed in serviceable condition. No sign of anomaly observed."}]', 'UTTM: No significant wall lost detected compared to nominal thickness. Please refer attachment report.', '[{"text": "2.2: To be monitored on next opportunity.\n2.5: To be monitored on next opportunity."}]', 1, '2025-12-22 12:56:52.771749', '2025-12-22 12:57:02.36426') ON CONFLICT DO NOTHING;
INSERT INTO public.findings_summary VALUES (4, 13, 2, 'Not applicable', '2.3 All internal attachment and internal nozzles were found securely intact with no visible defect.
2.4 Nozzles N-2 and N-15 flange included its gasket seat area found in satisfactory condition.
2.5 H-1 and M-1 flange and cover noted with no sign of anomaly. Gasket seat area was found free any significant damage.
2.6 Internal top dish head surface noted with discoloration.', '[]', '[]', 'UTTM: No significant wall loss detected compared to nominal thickness upon testing. Please refer UTTM report', '[{"text": "1.7: To perform surface preparation and apply protective coating or replace with fluorocarbon coated bolt and nuts."}]', 10, '2026-01-13 22:21:28.954027', '2026-01-13 22:21:30.712294') ON CONFLICT DO NOTHING;


--
-- TOC entry 3599 (class 0 OID 32808)
-- Dependencies: 219
-- Data for Name: inspections; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.inspections VALUES (6, 5, 7, NULL, 'archived', '2025-12-05', '', 1, '2025-12-05 09:48:05.968173', '2026-01-14 00:13:42.460096', 'Initial', 'Medium', '2025-12-05', '2025-12-24', NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, 'PLANT/01/VR-V-001/TA2025', '2026-01-07 15:01:31.921168', 7, '/uploads/reports/Visual Inspection Report_V-001.pdf', '2027-12-05', '', 'approved', 8, '2025-12-06 07:52:08.102591', NULL, 1, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.inspections VALUES (8, 5, NULL, 11, 'under_review', '2025-12-22', '', 1, '2025-12-22 12:52:15.916278', '2026-01-14 15:57:21.86188', 'Initial', 'Medium', '2025-12-22', '2025-12-30', NULL, NULL, NULL, NULL, NULL, NULL, NULL, true, 'PLANT/01/VR-001/TA2025', '2026-01-14 15:57:21.86188', 1, '/uploads/reports/Visual Inspection Report_V-001.pdf', '2027-12-22', '', 'rejected', 11, '2026-01-14 00:31:39.553168', 'do it again with respectful to the API 510', 5, 'MK PMT 1002') ON CONFLICT DO NOTHING;
INSERT INTO public.inspections VALUES (13, 2, 10, 11, 'approved', '2026-01-14', '', 1, '2026-01-13 22:18:54.063458', '2026-01-14 16:02:14.456302', 'Initial', 'Medium', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, 'PLANT 3/VI/R-201/TA2026', '2026-01-14 16:02:14.456302', 1, '/uploads/reports/Visual Inspection Report_R-201.pdf', '2028-01-14', '', 'approved', 11, '2026-01-14 00:32:34.146589', 'good job', 8, 'MK PMT 1001') ON CONFLICT DO NOTHING;


--
-- TOC entry 3614 (class 0 OID 41137)
-- Dependencies: 234
-- Data for Name: observation_photos; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.observation_photos VALUES (10, 26, 1, '2025-12-05 09:51:07.501382') ON CONFLICT DO NOTHING;
INSERT INTO public.observation_photos VALUES (10, 27, 2, '2025-12-05 09:51:07.503413') ON CONFLICT DO NOTHING;
INSERT INTO public.observation_photos VALUES (11, 28, 1, '2025-12-05 09:51:12.006209') ON CONFLICT DO NOTHING;
INSERT INTO public.observation_photos VALUES (15, 38, 1, '2025-12-22 13:02:35.380221') ON CONFLICT DO NOTHING;
INSERT INTO public.observation_photos VALUES (16, 39, 1, '2025-12-22 13:06:52.959366') ON CONFLICT DO NOTHING;
INSERT INTO public.observation_photos VALUES (16, 40, 2, '2025-12-22 13:06:52.960788') ON CONFLICT DO NOTHING;
INSERT INTO public.observation_photos VALUES (16, 41, 3, '2025-12-22 13:06:52.961745') ON CONFLICT DO NOTHING;
INSERT INTO public.observation_photos VALUES (17, 43, 1, '2025-12-22 13:09:44.176329') ON CONFLICT DO NOTHING;
INSERT INTO public.observation_photos VALUES (17, 42, 2, '2025-12-22 13:09:44.178392') ON CONFLICT DO NOTHING;
INSERT INTO public.observation_photos VALUES (18, 44, 1, '2025-12-22 13:13:08.758999') ON CONFLICT DO NOTHING;
INSERT INTO public.observation_photos VALUES (20, 45, 1, '2025-12-22 13:14:50.2433') ON CONFLICT DO NOTHING;
INSERT INTO public.observation_photos VALUES (21, 47, 1, '2025-12-22 13:18:02.143987') ON CONFLICT DO NOTHING;
INSERT INTO public.observation_photos VALUES (22, 48, 1, '2025-12-22 13:20:34.998811') ON CONFLICT DO NOTHING;
INSERT INTO public.observation_photos VALUES (22, 49, 2, '2025-12-22 13:20:35.003719') ON CONFLICT DO NOTHING;
INSERT INTO public.observation_photos VALUES (23, 50, 1, '2025-12-22 13:23:46.687379') ON CONFLICT DO NOTHING;
INSERT INTO public.observation_photos VALUES (23, 51, 2, '2025-12-22 13:23:46.692054') ON CONFLICT DO NOTHING;
INSERT INTO public.observation_photos VALUES (24, 52, 1, '2025-12-22 13:25:07.17354') ON CONFLICT DO NOTHING;
INSERT INTO public.observation_photos VALUES (24, 53, 2, '2025-12-22 13:25:07.177656') ON CONFLICT DO NOTHING;
INSERT INTO public.observation_photos VALUES (25, 55, 1, '2025-12-24 11:24:59.352775') ON CONFLICT DO NOTHING;
INSERT INTO public.observation_photos VALUES (25, 54, 2, '2025-12-24 11:24:59.360467') ON CONFLICT DO NOTHING;
INSERT INTO public.observation_photos VALUES (26, 57, 1, '2025-12-24 11:31:54.430029') ON CONFLICT DO NOTHING;
INSERT INTO public.observation_photos VALUES (26, 56, 2, '2025-12-24 11:31:54.435136') ON CONFLICT DO NOTHING;
INSERT INTO public.observation_photos VALUES (27, 59, 1, '2025-12-24 11:39:01.455852') ON CONFLICT DO NOTHING;
INSERT INTO public.observation_photos VALUES (27, 58, 2, '2025-12-24 11:39:01.462373') ON CONFLICT DO NOTHING;
INSERT INTO public.observation_photos VALUES (27, 60, 3, '2025-12-24 11:39:01.464131') ON CONFLICT DO NOTHING;
INSERT INTO public.observation_photos VALUES (28, 61, 1, '2025-12-24 11:41:08.635803') ON CONFLICT DO NOTHING;
INSERT INTO public.observation_photos VALUES (29, 63, 1, '2025-12-24 11:43:25.764743') ON CONFLICT DO NOTHING;
INSERT INTO public.observation_photos VALUES (30, 65, 1, '2025-12-24 11:46:29.152906') ON CONFLICT DO NOTHING;
INSERT INTO public.observation_photos VALUES (30, 64, 2, '2025-12-24 11:46:29.157924') ON CONFLICT DO NOTHING;
INSERT INTO public.observation_photos VALUES (32, 67, 1, '2025-12-24 11:53:04.887614') ON CONFLICT DO NOTHING;
INSERT INTO public.observation_photos VALUES (31, 66, 1, '2025-12-24 11:53:19.83638') ON CONFLICT DO NOTHING;
INSERT INTO public.observation_photos VALUES (33, 69, 1, '2025-12-24 11:53:32.34018') ON CONFLICT DO NOTHING;
INSERT INTO public.observation_photos VALUES (33, 68, 2, '2025-12-24 11:53:32.350852') ON CONFLICT DO NOTHING;
INSERT INTO public.observation_photos VALUES (34, 79, 1, '2026-01-13 22:24:58.273399') ON CONFLICT DO NOTHING;
INSERT INTO public.observation_photos VALUES (35, 82, 1, '2026-01-13 22:42:25.589692') ON CONFLICT DO NOTHING;
INSERT INTO public.observation_photos VALUES (35, 81, 2, '2026-01-13 22:42:25.596604') ON CONFLICT DO NOTHING;
INSERT INTO public.observation_photos VALUES (35, 80, 3, '2026-01-13 22:42:25.598657') ON CONFLICT DO NOTHING;
INSERT INTO public.observation_photos VALUES (36, 84, 1, '2026-01-13 22:45:43.556191') ON CONFLICT DO NOTHING;
INSERT INTO public.observation_photos VALUES (36, 83, 2, '2026-01-13 22:45:43.559412') ON CONFLICT DO NOTHING;
INSERT INTO public.observation_photos VALUES (37, 85, 1, '2026-01-13 22:49:46.553175') ON CONFLICT DO NOTHING;
INSERT INTO public.observation_photos VALUES (38, 87, 1, '2026-01-13 22:51:39.620528') ON CONFLICT DO NOTHING;
INSERT INTO public.observation_photos VALUES (38, 86, 2, '2026-01-13 22:51:39.623351') ON CONFLICT DO NOTHING;
INSERT INTO public.observation_photos VALUES (39, 88, 1, '2026-01-13 22:51:59.266349') ON CONFLICT DO NOTHING;
INSERT INTO public.observation_photos VALUES (40, 89, 1, '2026-01-13 22:53:30.811179') ON CONFLICT DO NOTHING;


--
-- TOC entry 3603 (class 0 OID 32857)
-- Dependencies: 223
-- Data for Name: observations; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.observations VALUES (10, 6, 'Weldment', '1.1 Through-wall corrosion detected with active leak or imminent failure risk

1.2 External corrosion detected on shell surface, localized area approximately 50mm x 50mm with minimal metal loss', '1.1 Engineering assessment required to determine repair methodology

1.2 Plan repair for next major turnaround', 'Moderate', 7, '2025-12-05 09:49:05.643304', '2025-12-05 09:49:05.643304', 'Corrosion', 5, 'Area A - Block 2', '1', NULL, NULL, NULL, 'Open', 'Repair', 'Medium', NULL, 'Pending', NULL, NULL, NULL, 'Internal') ON CONFLICT DO NOTHING;
INSERT INTO public.observations VALUES (11, 6, 'Shell', '2.1 Through-wall corrosion detected with active leak or imminent failure risk

2.2 Severe corrosion with significant metal loss exceeding 3mm depth', '2.1 Continue monitoring during routine inspections, document progression

2.2 Monitor on next scheduled inspection, no immediate action required', 'Minor', 7, '2025-12-05 09:49:41.853889', '2025-12-05 09:49:41.853889', 'Corrosion', 5, '3 o''clock position', '2', NULL, NULL, NULL, 'Open', 'Monitor', 'Medium', NULL, 'Pending', NULL, NULL, NULL, 'Internal') ON CONFLICT DO NOTHING;
INSERT INTO public.observations VALUES (15, 8, 'V-950A', '1.1 General view of equipment V-950A facing from south side was found fully coated. All associate parts was noted on its position and in satisfactory condition.', '1.1 nill', 'Minor', 1, '2025-12-22 13:02:05.004088', '2025-12-22 13:02:05.004088', 'General Wear', 5, '3 o''clock position', '1', NULL, NULL, NULL, 'Open', 'No Action', 'Low', NULL, 'Pending', NULL, NULL, NULL, 'Internal') ON CONFLICT DO NOTHING;
INSERT INTO public.observations VALUES (16, 8, 'Nameplate', '2.1  - 2.3 Nameplate and PMT number were found securely intact in its place and legible.', '2.1 - 2.3 Nil.', 'Minor', 1, '2025-12-22 13:06:44.253041', '2025-12-22 13:06:44.253041', 'Other', 5, '', '2', NULL, NULL, NULL, 'Open', 'No Action', 'Low', NULL, 'Pending', NULL, NULL, NULL, 'Internal') ON CONFLICT DO NOTHING;
INSERT INTO public.observations VALUES (18, 8, 'bottom dish head', '4.1 View of bottom dish head was found in satisfactory condition. No sign of abnormalities observed.', '4.1 Nil.', 'Minor', 1, '2025-12-22 13:11:43.426858', '2025-12-22 13:11:43.426858', 'General Wear', 5, '', '4', NULL, NULL, NULL, 'Open', 'No Action', 'Low', NULL, 'Pending', NULL, NULL, NULL, 'Internal') ON CONFLICT DO NOTHING;
INSERT INTO public.observations VALUES (17, 8, 'Concrete', '3.1 Concrete foundation and support legs were observed in satisfactory condition with no sign of abnormalities.

3.2 Anchor bolts observed secured tighten and in good condition.', '3.1 3.1 Nil

3.2 3.2 Nil', 'Minor', 1, '2025-12-22 13:09:20.863055', '2025-12-22 13:12:44.26969', 'Other', 5, '', '3', NULL, NULL, NULL, 'Open', 'No Action', 'Low', NULL, 'Pending', NULL, NULL, NULL, 'Internal') ON CONFLICT DO NOTHING;
INSERT INTO public.observations VALUES (20, 8, 'Davit arm', '5.1 Davit arm, man hole and its cover were noted in serviceable condition.', '5.1 Nil.', 'Minor', 1, '2025-12-22 13:14:38.54261', '2025-12-22 13:14:38.54261', 'Other', 5, '', '5', NULL, NULL, NULL, 'Open', 'No Action', 'Low', NULL, 'Pending', NULL, NULL, NULL, 'Internal') ON CONFLICT DO NOTHING;
INSERT INTO public.observations VALUES (21, 8, 'Shell', '6.1 View of shell externally observed in satisfactory condition with no sign of abnormalities  or permanent physical appearance found. External coating noted intact properly on equipment surface.', '6.1 Nil.', 'Minor', 1, '2025-12-22 13:17:51.206512', '2025-12-22 13:17:51.206512', 'Other', 5, '', '6', NULL, NULL, NULL, 'Open', 'No Action', 'Low', NULL, 'Pending', NULL, NULL, NULL, 'Internal') ON CONFLICT DO NOTHING;
INSERT INTO public.observations VALUES (22, 8, 'top dish', '7.1 View of top dish head was found in satisfactory condition. No sign of abnormalities observed.

7.2 Lifting lug found securely intact on equipment.', '7.1 Nil.

7.2 Nil.', 'Minor', 1, '2025-12-22 13:20:15.019277', '2025-12-22 13:20:15.019277', 'Other', 5, '', '7', NULL, NULL, NULL, 'Open', 'No Action', 'Low', NULL, 'Pending', NULL, NULL, NULL, 'Internal') ON CONFLICT DO NOTHING;
INSERT INTO public.observations VALUES (23, 8, 'Nozzle', '8.1 & 8.2 All attachment nozzles were observed in serviceable condition. No sign of anomaly seen.', '8.1 & 8.2 Nil.', 'Minor', 1, '2025-12-22 13:23:27.050377', '2025-12-22 13:23:27.050377', 'Other', 5, '', '8', NULL, NULL, NULL, 'Open', 'No Action', 'Low', NULL, 'Pending', NULL, NULL, NULL, 'Internal') ON CONFLICT DO NOTHING;
INSERT INTO public.observations VALUES (24, 8, 'Pressure gauge', '9.1 & 9.2 Pressure gauge was observed in serviceable condition. No sign of abnormalities observed.', '9.1 & 9.2 Nil.', 'Minor', 1, '2025-12-22 13:24:54.952976', '2025-12-22 13:24:54.952976', 'Other', 5, '', '9', NULL, NULL, NULL, 'Open', 'No Action', 'Low', NULL, 'Pending', NULL, NULL, NULL, 'Internal') ON CONFLICT DO NOTHING;
INSERT INTO public.observations VALUES (25, 8, 'manhole cover', '10.1 & 10.2 Internal view of manhole cover noted with evidence of scratch mark on gasket seat area at 7 o’clock position. Defect was noted on previous TA and no further defect propagation compared to previous report.
', '10.1 & 10.2 Nil.', 'Minor', 1, '2025-12-22 13:26:58.582832', '2025-12-22 13:26:58.582832', 'Other', 5, '', '10', NULL, NULL, NULL, 'Open', 'No Action', 'Low', NULL, 'Pending', NULL, NULL, NULL, 'Internal') ON CONFLICT DO NOTHING;
INSERT INTO public.observations VALUES (26, 8, 'manhole flange', '11.1 & 11.3 View of manhole flange was found in serviceable condition except  for evidence of mechanical mark on gasket seat area at position 1 o’clock with approx. 5mm of maximum of radial projection. Defect was noted on previous TA. No further defect propagation compared to previous report.', '11.1 & 11.3 Nil.', 'Minor', 1, '2025-12-24 11:31:38.149266', '2025-12-24 11:31:38.149266', 'Other', 5, '', '11', NULL, NULL, NULL, 'Open', 'No Action', 'Low', NULL, 'Pending', NULL, NULL, NULL, 'Internal') ON CONFLICT DO NOTHING;
INSERT INTO public.observations VALUES (27, 8, 'manhole', '12.1 Internal view of manhole and its neck found in good condition except for evidence of mechanical mark at 12 o’clock and 6 o’clock.

12.2 Close up view of mechanical mark with 5mm length and < 0.5mm depth.

12.3 Close up view of mechanical mark with length approx. 40mm and < 0.5mm depth.', '12.1  - 12.3 Nil.', 'Minor', 1, '2025-12-24 11:38:45.69513', '2025-12-24 11:38:45.69513', 'Other', 5, '', '12', NULL, NULL, NULL, 'Open', 'No Action', 'Low', NULL, 'Pending', NULL, NULL, NULL, 'Internal') ON CONFLICT DO NOTHING;
INSERT INTO public.observations VALUES (28, 8, 'bottom dish head', '13.1  Internal view of bottom dish head was observed in satisfactory condition with no sign of abnormalities.', '13.1 Nil.', 'Minor', 1, '2025-12-24 11:40:58.463024', '2025-12-24 11:40:58.463024', 'Other', 5, '', '13', NULL, NULL, NULL, 'Open', 'No Action', 'Low', NULL, 'Pending', NULL, NULL, NULL, 'Internal') ON CONFLICT DO NOTHING;
INSERT INTO public.observations VALUES (29, 8, 'bottom internal shell', '14.1  View of bottom internal shell wall observed in satisfactory with no sign of anomaly. All internal circumferential seam and longitudinal seam observed in good profile with no sign of relevant defect except for two locations of cluster porosity noted at CW1 and LW1B.', '14.1 To be monitored next opportunity.', 'Minor', 1, '2025-12-24 11:43:13.652665', '2025-12-24 11:43:13.652665', 'Other', 5, '', '14', NULL, NULL, NULL, 'Open', 'No Action', 'Low', NULL, 'Pending', NULL, NULL, NULL, 'Internal') ON CONFLICT DO NOTHING;
INSERT INTO public.observations VALUES (30, 8, 'cluster porosity', '15.1 Closed view of cluster porosity on LW1B with approx. 5mm of length, 3mm of width and maximum 4mm of depth. No further increment in size of the porosity based on previous report.


15.2  Closed view of cluster porosity on CW1 with approx. 10mm of length, 3mm of width and maximum 4mm of depth. No further increment in size of the porosity based on previous report.', '15.1 & 15.2 To be monitored on next opportunity since DPT was already performed previously with acceptable results.', 'Minor', 1, '2025-12-24 11:46:13.641996', '2025-12-24 11:46:13.641996', 'Other', 5, '', '15', NULL, NULL, NULL, 'Open', 'No Action', 'Low', NULL, 'Pending', NULL, NULL, NULL, 'Internal') ON CONFLICT DO NOTHING;
INSERT INTO public.observations VALUES (31, 8, 'middle internal shell wall', '16.1 View of middle internal shell wall observed in satisfactory with no sign of bulging or any significant damage. (where seen and accessible).', '16.1 Nil.', 'Minor', 1, '2025-12-24 11:49:27.91129', '2025-12-24 11:49:27.91129', 'Other', 5, '', '16', NULL, NULL, NULL, 'Open', 'No Action', 'Low', NULL, 'Pending', NULL, NULL, NULL, 'Internal') ON CONFLICT DO NOTHING;
INSERT INTO public.observations VALUES (32, 8, 'top dish head', '17.1 View of top dish head was found with no sign of significant abnormalities (as  per viewed via bottom head).', '17.1 Nil.', 'Minor', 1, '2025-12-24 11:51:39.189217', '2025-12-24 11:51:39.189217', 'Other', 5, '', '17', NULL, NULL, NULL, 'Open', 'No Action', 'Low', NULL, 'Pending', NULL, NULL, NULL, 'Internal') ON CONFLICT DO NOTHING;
INSERT INTO public.observations VALUES (33, 8, 'Nozzle', '18.1  & 18.2 All attachment nozzles internally observed in serviceable condition. No sign of anomaly observed.', '18.1 & 18.2 Nil.', 'Minor', 1, '2025-12-24 11:52:38.476724', '2025-12-24 11:52:38.476724', 'Other', 5, '', '18', NULL, NULL, NULL, 'Open', 'No Action', 'Low', NULL, 'Pending', NULL, NULL, NULL, 'Internal') ON CONFLICT DO NOTHING;
INSERT INTO public.observations VALUES (34, 13, 'General view', '1.1 General view of equipment R-001 facing plant north side. Equipment was found fully insulated. Insulation noted in serviceable condition.', '1.1  Nil.', 'Minor', 10, '2026-01-13 22:24:03.518594', '2026-01-13 22:25:21.608246', 'Other', 2, '', '1', NULL, NULL, NULL, 'Open', 'No Action', 'Low', NULL, 'Pending', NULL, NULL, NULL, 'Internal') ON CONFLICT DO NOTHING;
INSERT INTO public.observations VALUES (35, 13, 'Nameplate', '2.1  - 2.3 Nameplate, PMT number was found readable and secured on the equipment shell. Equipment number noted securely intact on bottom section of equipment.', '2.1  - 2.3 Nil.', 'Minor', 10, '2026-01-13 22:40:01.558576', '2026-01-13 22:40:01.558576', 'Other', 2, '', '2', NULL, NULL, NULL, 'Open', 'No Action', 'Low', NULL, 'Pending', NULL, NULL, NULL, 'Internal') ON CONFLICT DO NOTHING;
INSERT INTO public.observations VALUES (36, 13, 'Concrete foundation', '3.1 Concrete foundation and skirt observed in satisfactory condition with no significant damage.

3.2 Anchor bolts and earthing cable noted secured intact with no sign of degradation.

', '3.1 Nil.

3.2 Nil.', 'Minor', 10, '2026-01-13 22:45:05.6239', '2026-01-13 22:45:05.6239', 'Other', 2, '', '3', NULL, NULL, NULL, 'Open', 'No Action', 'Low', NULL, 'Pending', NULL, NULL, NULL, 'Internal') ON CONFLICT DO NOTHING;
INSERT INTO public.observations VALUES (37, 13, 'bottom dish head', '4.1 Bottom dish head found in satisfactory condition. No evidence of significant damage noted.', '4.1 Nil.', 'Minor', 10, '2026-01-13 22:47:29.696234', '2026-01-13 22:47:29.696234', 'Other', 2, '', '4', NULL, NULL, NULL, 'Open', 'No Action', 'Low', NULL, 'Pending', NULL, NULL, NULL, 'Internal') ON CONFLICT DO NOTHING;
INSERT INTO public.observations VALUES (38, 13, 'Nozzle', '5.1  - 5.2 Nozzles N-2 and N-15 flange included its gasket seat area found in satisfactory condition. No sign of flange imperfection noted.', '5.1  - 5.4 Nil.', 'Minor', 10, '2026-01-13 22:48:10.278339', '2026-01-13 22:48:10.278339', 'General Wear', 2, '', '5', NULL, NULL, NULL, 'Open', 'No Action', 'Low', NULL, 'Pending', NULL, NULL, NULL, 'Internal') ON CONFLICT DO NOTHING;
INSERT INTO public.observations VALUES (39, 13, 'Shell', '6.1 Equipment shell noted in good condition with insulation securely intact.', '6.1 Nil.', 'Minor', 10, '2026-01-13 22:48:53.292106', '2026-01-13 22:48:53.292106', 'General Wear', 2, '', '6', NULL, NULL, NULL, 'Open', 'No Action', 'Low', NULL, 'Pending', NULL, NULL, NULL, 'Internal') ON CONFLICT DO NOTHING;
INSERT INTO public.observations VALUES (40, 13, 'top dish head', '7.1 Top dish head observed in satisfactory profile with no sign of damage on insulation.', '7.1 Nil.', 'Minor', 10, '2026-01-13 22:53:03.440672', '2026-01-13 22:53:03.440672', 'General Wear', 2, '', '7', NULL, NULL, NULL, 'Open', 'No Action', 'Low', NULL, 'Pending', NULL, NULL, NULL, 'Internal') ON CONFLICT DO NOTHING;


--
-- TOC entry 3601 (class 0 OID 32837)
-- Dependencies: 221
-- Data for Name: photos; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.photos VALUES (27, 6, '/uploads/photos/Screenshot 2025-10-23 222243-1764917431167-795320041.png', '1', NULL, NULL, 7, 2, NULL, '2025-12-05 09:50:31.357434', NULL, 1172005, 'image/png', 'Screenshot 2025-10-23 222243.png', NULL, NULL, '2025-12-05 09:50:31.357434', 'Screenshot 2025-10-23 222243-1764917431167-795320041.png', false) ON CONFLICT DO NOTHING;
INSERT INTO public.photos VALUES (38, 8, '/uploads/photos/Screenshot 2025-12-22 175729-1766397746957-429487748.png', '1', NULL, NULL, 1, 1, NULL, '2025-12-22 13:02:27.028348', NULL, 112209, 'image/png', 'Screenshot 2025-12-22 175729.png', NULL, NULL, '2025-12-22 13:02:27.028348', 'Screenshot 2025-12-22 175729-1766397746957-429487748.png', false) ON CONFLICT DO NOTHING;
INSERT INTO public.photos VALUES (39, 8, '/uploads/photos/Screenshot 2025-12-22 180249-1766397850032-99601078.png', '2', NULL, NULL, 1, 1, NULL, '2025-12-22 13:04:10.099215', NULL, 25572, 'image/png', 'Screenshot 2025-12-22 180249.png', NULL, NULL, '2025-12-22 13:04:10.099215', 'Screenshot 2025-12-22 180249-1766397850032-99601078.png', false) ON CONFLICT DO NOTHING;
INSERT INTO public.photos VALUES (40, 8, '/uploads/photos/Screenshot 2025-12-22 180259-1766397850032-872593841.png', '2', NULL, NULL, 1, 2, NULL, '2025-12-22 13:04:10.104982', NULL, 26813, 'image/png', 'Screenshot 2025-12-22 180259.png', NULL, NULL, '2025-12-22 13:04:10.104982', 'Screenshot 2025-12-22 180259-1766397850032-872593841.png', false) ON CONFLICT DO NOTHING;
INSERT INTO public.photos VALUES (26, 6, '/uploads/photos/Screenshot 2025-10-23 222228-1764917431160-587229895.png', '1', NULL, NULL, 7, 1, NULL, '2025-12-05 09:50:31.353446', NULL, 672683, 'image/png', 'Screenshot 2025-10-23 222228.png', NULL, NULL, '2025-12-05 09:50:31.353446', 'Screenshot 2025-10-23 222228-1764917431160-587229895.png', true) ON CONFLICT DO NOTHING;
INSERT INTO public.photos VALUES (28, 6, '/uploads/photos/Screenshot 2025-10-27 184713-1764917461721-61936059.png', '2', NULL, NULL, 7, 1, NULL, '2025-12-05 09:51:01.781602', NULL, 575517, 'image/png', 'Screenshot 2025-10-27 184713.png', NULL, NULL, '2025-12-05 09:51:01.781602', 'Screenshot 2025-10-27 184713-1764917461721-61936059.png', true) ON CONFLICT DO NOTHING;
INSERT INTO public.photos VALUES (41, 8, '/uploads/photos/Screenshot 2025-12-22 180307-1766397850033-650822684.png', '2', NULL, NULL, 1, 3, NULL, '2025-12-22 13:04:10.106612', NULL, 24175, 'image/png', 'Screenshot 2025-12-22 180307.png', NULL, NULL, '2025-12-22 13:04:10.106612', 'Screenshot 2025-12-22 180307-1766397850033-650822684.png', false) ON CONFLICT DO NOTHING;
INSERT INTO public.photos VALUES (42, 8, '/uploads/photos/Screenshot 2025-12-22 180703-1766398053989-346074597.png', '3', NULL, NULL, 1, 1, NULL, '2025-12-22 13:07:34.051134', NULL, 62813, 'image/png', 'Screenshot 2025-12-22 180703.png', NULL, NULL, '2025-12-22 13:07:34.051134', 'Screenshot 2025-12-22 180703-1766398053989-346074597.png', false) ON CONFLICT DO NOTHING;
INSERT INTO public.photos VALUES (43, 8, '/uploads/photos/Screenshot 2025-12-22 180712-1766398053989-983057621.png', '3', NULL, NULL, 1, 2, NULL, '2025-12-22 13:07:34.056416', NULL, 36456, 'image/png', 'Screenshot 2025-12-22 180712.png', NULL, NULL, '2025-12-22 13:07:34.056416', 'Screenshot 2025-12-22 180712-1766398053989-983057621.png', false) ON CONFLICT DO NOTHING;
INSERT INTO public.photos VALUES (44, 8, '/uploads/photos/Screenshot 2025-12-22 181006-1766398220642-308102361.png', '4', NULL, NULL, 1, 1, NULL, '2025-12-22 13:10:20.704993', NULL, 112698, 'image/png', 'Screenshot 2025-12-22 181006.png', NULL, NULL, '2025-12-22 13:10:20.704993', 'Screenshot 2025-12-22 181006-1766398220642-308102361.png', false) ON CONFLICT DO NOTHING;
INSERT INTO public.photos VALUES (45, 8, '/uploads/photos/Screenshot 2025-12-22 181322-1766398423601-394617655.png', '5', NULL, NULL, 1, 1, NULL, '2025-12-22 13:13:43.661664', NULL, 127715, 'image/png', 'Screenshot 2025-12-22 181322.png', NULL, NULL, '2025-12-22 13:13:43.661664', 'Screenshot 2025-12-22 181322-1766398423601-394617655.png', false) ON CONFLICT DO NOTHING;
INSERT INTO public.photos VALUES (47, 8, '/uploads/photos/Screenshot 2025-12-22 181533-1766398598098-810878665.png', '6', NULL, NULL, 1, 1, NULL, '2025-12-22 13:16:38.159087', NULL, 124032, 'image/png', 'Screenshot 2025-12-22 181533.png', NULL, NULL, '2025-12-22 13:16:38.159087', 'Screenshot 2025-12-22 181533-1766398598098-810878665.png', false) ON CONFLICT DO NOTHING;
INSERT INTO public.photos VALUES (48, 8, '/uploads/photos/Screenshot 2025-12-22 181824-1766398736589-900010676.png', '7', NULL, NULL, 1, 1, NULL, '2025-12-22 13:18:56.650791', NULL, 57247, 'image/png', 'Screenshot 2025-12-22 181824.png', NULL, NULL, '2025-12-22 13:18:56.650791', 'Screenshot 2025-12-22 181824-1766398736589-900010676.png', false) ON CONFLICT DO NOTHING;
INSERT INTO public.photos VALUES (49, 8, '/uploads/photos/Screenshot 2025-12-22 181845-1766398736589-136997466.png', '7', NULL, NULL, 1, 2, NULL, '2025-12-22 13:18:56.655998', NULL, 28420, 'image/png', 'Screenshot 2025-12-22 181845.png', NULL, NULL, '2025-12-22 13:18:56.655998', 'Screenshot 2025-12-22 181845-1766398736589-136997466.png', false) ON CONFLICT DO NOTHING;
INSERT INTO public.photos VALUES (50, 8, '/uploads/photos/Screenshot 2025-12-22 182134-1766398922634-797441845.png', '8', NULL, NULL, 1, 1, NULL, '2025-12-22 13:22:02.695169', NULL, 37661, 'image/png', 'Screenshot 2025-12-22 182134.png', NULL, NULL, '2025-12-22 13:22:02.695169', 'Screenshot 2025-12-22 182134-1766398922634-797441845.png', false) ON CONFLICT DO NOTHING;
INSERT INTO public.photos VALUES (51, 8, '/uploads/photos/Screenshot 2025-12-22 182148-1766398922635-840503003.png', '8', NULL, NULL, 1, 2, NULL, '2025-12-22 13:22:02.700977', NULL, 42347, 'image/png', 'Screenshot 2025-12-22 182148.png', NULL, NULL, '2025-12-22 13:22:02.700977', 'Screenshot 2025-12-22 182148-1766398922635-840503003.png', false) ON CONFLICT DO NOTHING;
INSERT INTO public.photos VALUES (52, 8, '/uploads/photos/Screenshot 2025-12-22 182302-1766399050994-793120720.png', '9', NULL, NULL, 1, 1, NULL, '2025-12-22 13:24:11.058748', NULL, 30746, 'image/png', 'Screenshot 2025-12-22 182302.png', NULL, NULL, '2025-12-22 13:24:11.058748', 'Screenshot 2025-12-22 182302-1766399050994-793120720.png', false) ON CONFLICT DO NOTHING;
INSERT INTO public.photos VALUES (53, 8, '/uploads/photos/Screenshot 2025-12-22 182309-1766399050994-103226069.png', '9', NULL, NULL, 1, 2, NULL, '2025-12-22 13:24:11.063765', NULL, 44365, 'image/png', 'Screenshot 2025-12-22 182309.png', NULL, NULL, '2025-12-22 13:24:11.063765', 'Screenshot 2025-12-22 182309-1766399050994-103226069.png', false) ON CONFLICT DO NOTHING;
INSERT INTO public.photos VALUES (54, 8, '/uploads/photos/Screenshot 2025-12-22 182540-1766399175247-948987858.png', '10', NULL, NULL, 1, 1, NULL, '2025-12-22 13:26:15.308176', NULL, 40227, 'image/png', 'Screenshot 2025-12-22 182540.png', NULL, NULL, '2025-12-22 13:26:15.308176', 'Screenshot 2025-12-22 182540-1766399175247-948987858.png', false) ON CONFLICT DO NOTHING;
INSERT INTO public.photos VALUES (55, 8, '/uploads/photos/Screenshot 2025-12-22 182606-1766399175247-482760736.png', '10', NULL, NULL, 1, 2, NULL, '2025-12-22 13:26:15.3132', NULL, 40614, 'image/png', 'Screenshot 2025-12-22 182606.png', NULL, NULL, '2025-12-22 13:26:15.3132', 'Screenshot 2025-12-22 182606-1766399175247-482760736.png', false) ON CONFLICT DO NOTHING;
INSERT INTO public.photos VALUES (56, 8, '/uploads/photos/Screenshot 2025-12-24 162532-1766564978689-549457910.png', '11', NULL, NULL, 1, 1, NULL, '2025-12-24 11:29:38.790871', NULL, 28408, 'image/png', 'Screenshot 2025-12-24 162532.png', NULL, NULL, '2025-12-24 11:29:38.790871', 'Screenshot 2025-12-24 162532-1766564978689-549457910.png', false) ON CONFLICT DO NOTHING;
INSERT INTO public.photos VALUES (57, 8, '/uploads/photos/Screenshot 2025-12-24 162543-1766564978690-592387483.png', '11', NULL, NULL, 1, 2, NULL, '2025-12-24 11:29:38.801248', NULL, 23906, 'image/png', 'Screenshot 2025-12-24 162543.png', NULL, NULL, '2025-12-24 11:29:38.801248', 'Screenshot 2025-12-24 162543-1766564978690-592387483.png', false) ON CONFLICT DO NOTHING;
INSERT INTO public.photos VALUES (58, 8, '/uploads/photos/Screenshot 2025-12-24 163541-1766565415112-248354333.png', '12', NULL, NULL, 1, 1, NULL, '2025-12-24 11:36:55.202662', NULL, 29744, 'image/png', 'Screenshot 2025-12-24 163541.png', NULL, NULL, '2025-12-24 11:36:55.202662', 'Screenshot 2025-12-24 163541-1766565415112-248354333.png', false) ON CONFLICT DO NOTHING;
INSERT INTO public.photos VALUES (59, 8, '/uploads/photos/Screenshot 2025-12-24 163612-1766565415112-919876130.png', '12', NULL, NULL, 1, 2, NULL, '2025-12-24 11:36:55.211952', NULL, 33392, 'image/png', 'Screenshot 2025-12-24 163612.png', NULL, NULL, '2025-12-24 11:36:55.211952', 'Screenshot 2025-12-24 163612-1766565415112-919876130.png', false) ON CONFLICT DO NOTHING;
INSERT INTO public.photos VALUES (60, 8, '/uploads/photos/Screenshot 2025-12-24 163626-1766565415112-228635065.png', '12', NULL, NULL, 1, 3, NULL, '2025-12-24 11:36:55.213356', NULL, 34474, 'image/png', 'Screenshot 2025-12-24 163626.png', NULL, NULL, '2025-12-24 11:36:55.213356', 'Screenshot 2025-12-24 163626-1766565415112-228635065.png', false) ON CONFLICT DO NOTHING;
INSERT INTO public.photos VALUES (61, 8, '/uploads/photos/Screenshot 2025-12-24 163931-1766565600199-678511797.png', '13', NULL, NULL, 1, 1, NULL, '2025-12-24 11:40:00.402177', NULL, 79922, 'image/png', 'Screenshot 2025-12-24 163931.png', NULL, NULL, '2025-12-24 11:40:00.402177', 'Screenshot 2025-12-24 163931-1766565600199-678511797.png', false) ON CONFLICT DO NOTHING;
INSERT INTO public.photos VALUES (63, 8, '/uploads/photos/Screenshot 2025-12-24 164125-1766565724958-418611348.png', '14', NULL, NULL, 1, 1, NULL, '2025-12-24 11:42:04.971687', NULL, 114140, 'image/png', 'Screenshot 2025-12-24 164125.png', NULL, NULL, '2025-12-24 11:42:04.971687', 'Screenshot 2025-12-24 164125-1766565724958-418611348.png', false) ON CONFLICT DO NOTHING;
INSERT INTO public.photos VALUES (64, 8, '/uploads/photos/Screenshot 2025-12-24 164341-1766565880945-921404454.png', '15', NULL, NULL, 1, 1, NULL, '2025-12-24 11:44:41.027723', NULL, 42329, 'image/png', 'Screenshot 2025-12-24 164341.png', NULL, NULL, '2025-12-24 11:44:41.027723', 'Screenshot 2025-12-24 164341-1766565880945-921404454.png', false) ON CONFLICT DO NOTHING;
INSERT INTO public.photos VALUES (65, 8, '/uploads/photos/Screenshot 2025-12-24 164427-1766565880946-80625365.png', '15', NULL, NULL, 1, 2, NULL, '2025-12-24 11:44:41.035511', NULL, 49791, 'image/png', 'Screenshot 2025-12-24 164427.png', NULL, NULL, '2025-12-24 11:44:41.035511', 'Screenshot 2025-12-24 164427-1766565880946-80625365.png', false) ON CONFLICT DO NOTHING;
INSERT INTO public.photos VALUES (66, 8, '/uploads/photos/Screenshot 2025-12-24 164740-1766566118633-644744677.png', '16', NULL, NULL, 1, 1, NULL, '2025-12-24 11:48:38.714757', NULL, 74030, 'image/png', 'Screenshot 2025-12-24 164740.png', NULL, NULL, '2025-12-24 11:48:38.714757', 'Screenshot 2025-12-24 164740-1766566118633-644744677.png', false) ON CONFLICT DO NOTHING;
INSERT INTO public.photos VALUES (67, 8, '/uploads/photos/Screenshot 2025-12-24 164804-1766566191321-665489210.png', '17', NULL, NULL, 1, 1, NULL, '2025-12-24 11:49:51.399005', NULL, 95899, 'image/png', 'Screenshot 2025-12-24 164804.png', NULL, NULL, '2025-12-24 11:49:51.399005', 'Screenshot 2025-12-24 164804-1766566191321-665489210.png', false) ON CONFLICT DO NOTHING;
INSERT INTO public.photos VALUES (68, 8, '/uploads/photos/Screenshot 2025-12-24 164812-1766566202233-774990414.png', '18', NULL, NULL, 1, 1, NULL, '2025-12-24 11:50:02.311975', NULL, 36593, 'image/png', 'Screenshot 2025-12-24 164812.png', NULL, NULL, '2025-12-24 11:50:02.311975', 'Screenshot 2025-12-24 164812-1766566202233-774990414.png', false) ON CONFLICT DO NOTHING;
INSERT INTO public.photos VALUES (69, 8, '/uploads/photos/Screenshot 2025-12-24 164821-1766566202233-92654167.png', '18', NULL, NULL, 1, 2, NULL, '2025-12-24 11:50:02.318796', NULL, 39475, 'image/png', 'Screenshot 2025-12-24 164821.png', NULL, NULL, '2025-12-24 11:50:02.318796', 'Screenshot 2025-12-24 164821-1766566202233-92654167.png', false) ON CONFLICT DO NOTHING;
INSERT INTO public.photos VALUES (79, 13, '/uploads/photos/Screenshot 2026-01-14 032418-1768332278325-605321410.png', '1', NULL, NULL, 10, 1, NULL, '2026-01-13 22:24:38.424212', NULL, 81659, 'image/png', 'Screenshot 2026-01-14 032418.png', NULL, NULL, '2026-01-13 22:24:38.424212', 'Screenshot 2026-01-14 032418-1768332278325-605321410.png', false) ON CONFLICT DO NOTHING;
INSERT INTO public.photos VALUES (80, 13, '/uploads/photos/Screenshot 2026-01-14 034019-1768333248905-287476269.png', '2', NULL, NULL, 10, 1, NULL, '2026-01-13 22:40:48.999707', NULL, 30346, 'image/png', 'Screenshot 2026-01-14 034019.png', NULL, NULL, '2026-01-13 22:40:48.999707', 'Screenshot 2026-01-14 034019-1768333248905-287476269.png', false) ON CONFLICT DO NOTHING;
INSERT INTO public.photos VALUES (82, 13, '/uploads/photos/Screenshot 2026-01-14 034033-1768333248906-131043334.png', '2', NULL, NULL, 10, 3, NULL, '2026-01-13 22:40:49.009582', NULL, 15373, 'image/png', 'Screenshot 2026-01-14 034033.png', NULL, NULL, '2026-01-13 22:40:49.009582', 'Screenshot 2026-01-14 034033-1768333248906-131043334.png', true) ON CONFLICT DO NOTHING;
INSERT INTO public.photos VALUES (81, 13, '/uploads/photos/Screenshot 2026-01-14 034024-1768333248905-252420852.png', '2', NULL, NULL, 10, 2, NULL, '2026-01-13 22:40:49.007816', NULL, 20139, 'image/png', 'Screenshot 2026-01-14 034024.png', NULL, NULL, '2026-01-13 22:40:49.007816', 'Screenshot 2026-01-14 034024-1768333248905-252420852.png', true) ON CONFLICT DO NOTHING;
INSERT INTO public.photos VALUES (83, 13, '/uploads/photos/Screenshot 2026-01-14 034515-1768333534979-197065273.png', '3', NULL, NULL, 10, 1, NULL, '2026-01-13 22:45:35.07149', NULL, 36073, 'image/png', 'Screenshot 2026-01-14 034515.png', NULL, NULL, '2026-01-13 22:45:35.07149', 'Screenshot 2026-01-14 034515-1768333534979-197065273.png', false) ON CONFLICT DO NOTHING;
INSERT INTO public.photos VALUES (84, 13, '/uploads/photos/Screenshot 2026-01-14 034521-1768333534979-118051655.png', '3', NULL, NULL, 10, 2, NULL, '2026-01-13 22:45:35.078631', NULL, 34079, 'image/png', 'Screenshot 2026-01-14 034521.png', NULL, NULL, '2026-01-13 22:45:35.078631', 'Screenshot 2026-01-14 034521-1768333534979-118051655.png', false) ON CONFLICT DO NOTHING;
INSERT INTO public.photos VALUES (85, 13, '/uploads/photos/Screenshot 2026-01-14 034602-1768333749924-608213749.png', '4', NULL, NULL, 10, 1, NULL, '2026-01-13 22:49:10.021351', NULL, 94761, 'image/png', 'Screenshot 2026-01-14 034602.png', NULL, NULL, '2026-01-13 22:49:10.021351', 'Screenshot 2026-01-14 034602-1768333749924-608213749.png', true) ON CONFLICT DO NOTHING;
INSERT INTO public.photos VALUES (87, 13, '/uploads/photos/Screenshot 2026-01-14 034617-1768333813864-214115277.png', '5', NULL, NULL, 10, 2, NULL, '2026-01-13 22:50:13.954767', NULL, 28570, 'image/png', 'Screenshot 2026-01-14 034617.png', NULL, NULL, '2026-01-13 22:50:13.954767', 'Screenshot 2026-01-14 034617-1768333813864-214115277.png', true) ON CONFLICT DO NOTHING;
INSERT INTO public.photos VALUES (86, 13, '/uploads/photos/Screenshot 2026-01-14 034610-1768333813864-551043038.png', '5', NULL, NULL, 10, 1, NULL, '2026-01-13 22:50:13.94831', NULL, 25248, 'image/png', 'Screenshot 2026-01-14 034610.png', NULL, NULL, '2026-01-13 22:50:13.94831', 'Screenshot 2026-01-14 034610-1768333813864-551043038.png', true) ON CONFLICT DO NOTHING;
INSERT INTO public.photos VALUES (88, 13, '/uploads/photos/Screenshot 2026-01-14 034625-1768333911731-232238353.png', '6', NULL, NULL, 10, 1, NULL, '2026-01-13 22:51:51.81259', NULL, 115530, 'image/png', 'Screenshot 2026-01-14 034625.png', NULL, NULL, '2026-01-13 22:51:51.81259', 'Screenshot 2026-01-14 034625-1768333911731-232238353.png', false) ON CONFLICT DO NOTHING;
INSERT INTO public.photos VALUES (89, 13, '/uploads/photos/Screenshot 2026-01-14 035311-1768334001828-978259083.png', '7', NULL, NULL, 10, 1, NULL, '2026-01-13 22:53:21.83344', NULL, 130712, 'image/png', 'Screenshot 2026-01-14 035311.png', NULL, NULL, '2026-01-13 22:53:21.83344', 'Screenshot 2026-01-14 035311-1768334001828-978259083.png', false) ON CONFLICT DO NOTHING;


--
-- TOC entry 3605 (class 0 OID 32884)
-- Dependencies: 225
-- Data for Name: presets; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 3618 (class 0 OID 41198)
-- Dependencies: 238
-- Data for Name: recommendation_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.recommendation_templates VALUES (1, 'Immediate Action', 'Critical', 'Immediate shutdown and repair required before return to service', true, NULL, '2025-11-22 08:56:20.694928') ON CONFLICT DO NOTHING;
INSERT INTO public.recommendation_templates VALUES (2, 'Immediate Action', 'Critical', 'Implement temporary repair and schedule permanent fix within 48 hours', true, NULL, '2025-11-22 08:56:20.694928') ON CONFLICT DO NOTHING;
INSERT INTO public.recommendation_templates VALUES (3, 'Repair', 'High', 'Schedule repair during next planned shutdown within 30 days', true, NULL, '2025-11-22 08:56:20.694928') ON CONFLICT DO NOTHING;
INSERT INTO public.recommendation_templates VALUES (4, 'Repair', 'High', 'Engineering assessment required to determine repair methodology', true, NULL, '2025-11-22 08:56:20.694928') ON CONFLICT DO NOTHING;
INSERT INTO public.recommendation_templates VALUES (5, 'Repair', 'Medium', 'Plan repair for next major turnaround', true, NULL, '2025-11-22 08:56:20.694928') ON CONFLICT DO NOTHING;
INSERT INTO public.recommendation_templates VALUES (6, 'Monitor', 'Medium', 'Continue monitoring during routine inspections, document progression', true, NULL, '2025-11-22 08:56:20.694928') ON CONFLICT DO NOTHING;
INSERT INTO public.recommendation_templates VALUES (7, 'Monitor', 'Low', 'Monitor on next scheduled inspection, no immediate action required', true, NULL, '2025-11-22 08:56:20.694928') ON CONFLICT DO NOTHING;
INSERT INTO public.recommendation_templates VALUES (8, 'Replace', 'High', 'Component replacement recommended during next shutdown', true, NULL, '2025-11-22 08:56:20.694928') ON CONFLICT DO NOTHING;
INSERT INTO public.recommendation_templates VALUES (9, 'Further Investigation', 'High', 'Conduct non-destructive testing (UT/RT) to determine extent', true, NULL, '2025-11-22 08:56:20.694928') ON CONFLICT DO NOTHING;
INSERT INTO public.recommendation_templates VALUES (10, 'Further Investigation', 'Medium', 'Perform thickness measurement to assess remaining wall', true, NULL, '2025-11-22 08:56:20.694928') ON CONFLICT DO NOTHING;
INSERT INTO public.recommendation_templates VALUES (11, 'No Action', 'Low', 'Acceptable per code requirements, no action required', true, NULL, '2025-11-22 08:56:20.694928') ON CONFLICT DO NOTHING;
INSERT INTO public.recommendation_templates VALUES (12, 'No Action', 'Low', 'Finding noted for documentation purposes, no repair needed', true, NULL, '2025-11-22 08:56:20.694928') ON CONFLICT DO NOTHING;


--
-- TOC entry 3609 (class 0 OID 32918)
-- Dependencies: 229
-- Data for Name: reports; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 3611 (class 0 OID 32945)
-- Dependencies: 231
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 3607 (class 0 OID 32901)
-- Dependencies: 227
-- Data for Name: templates; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 3595 (class 0 OID 32780)
-- Dependencies: 215
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.users VALUES (6, 'faisal Ahmed Qaid', 'reviewer@ipetro.com', '$2b$10$1wgsuRtsuiz6BVkz6Quy6OtUcqImOWRs.mEztZR3wqLYF0rUrvGiq', 'reviewer', 'QA Department', 'QA-02319', true, '2025-11-25 10:21:58.813099', '2025-11-26 06:42:35.310116', 'faisal') ON CONFLICT DO NOTHING;
INSERT INTO public.users VALUES (7, 'Ahmed Mohammed Qaid', 'ahmedq@ipetro.com', '$2b$10$oKaaf6ItKpupQ18U6JDcM.5W/6.JQ/H1EZDeL4mFdHVipb39Uxcim', 'inspector', 'Field Operations - Senior Team', '', true, '2025-11-26 06:45:49.286089', '2025-11-26 06:45:49.286089', 'ahmed') ON CONFLICT DO NOTHING;
INSERT INTO public.users VALUES (8, 'Faisal Harith', 'fis@ipetro.com', '$2b$10$ip56RPX1u.aFw6oEna1acOJr9oJd3L21a.nk3m00SpVQCqhQvmSMe', 'reviewer', 'Quality Assurance', '', true, '2025-12-05 09:45:08.949307', '2025-12-05 09:45:08.949307', 'faisal1') ON CONFLICT DO NOTHING;
INSERT INTO public.users VALUES (5, 'Ahmed', 'ahmed@ipetro.com', '$2b$10$ubO1QMaVq6waM1PDWDzkGOozMy0/dxvMncdQCb4RRlQCONLWn/EEi', 'inspector', 'Field Operations', 'INS-10293u', true, '2025-11-19 05:05:43.568558', '2026-01-07 10:34:43.794473', 'inspector02') ON CONFLICT DO NOTHING;
INSERT INTO public.users VALUES (1, 'Faisal Ahmed Mohammed Qaid', 'admin@ipetro.com', '$2b$10$BEW5HhOPjotGUrVEJFvMdurBfvcVuBSY71fJdb4Sio2fYluw4nSrK', 'admin', 'Administration', NULL, true, '2025-11-15 13:40:56.434254', '2026-01-07 14:56:58.604184', 'admin') ON CONFLICT DO NOTHING;
INSERT INTO public.users VALUES (2, 'Mohammed Ali', 'mohammedali@ipetro.com', '$2b$10$T7pkxggSYyU3whojQW052.vUk6d40lmulioGaXQ99Tdm.9xk9zI7O', 'inspector', 'Field Operations - Senior Team', 'API-510-12345-UPDATED', false, '2025-11-16 13:36:37.649852', '2026-01-13 20:22:43.283222', 'inspector01') ON CONFLICT DO NOTHING;
INSERT INTO public.users VALUES (9, 'sultan zayed', 'sh@gmail.com', '$2b$10$Kt23zo4PLrtIpZtH0qFk9O2.WCiQ.SfcI0Gu9F23c/2g4Z1u92g5u', 'admin', '', '', true, '2026-01-13 20:23:51.205424', '2026-01-13 20:23:51.205424', 'sultan') ON CONFLICT DO NOTHING;
INSERT INTO public.users VALUES (3, 'Fahad Khalid Mohammed', 'fahad@ipetro.com', '$2b$10$2KXKHbTmASIN1gnIQnw0fegaxyaSpYwthSwDw7OuSkmHslETi0CPG', 'reviewer', 'Quality Assurance', 'QA-001', false, '2025-11-16 13:38:25.595209', '2026-01-13 20:24:25.48263', 'reviewer01') ON CONFLICT DO NOTHING;
INSERT INTO public.users VALUES (4, 'Faisal Ahmed', 'faisal@ipetro.com', '$2b$10$8MY0Y7GDNakDjJM9NZnkauKcV4vC.6xI89LC6CdZxgG8cN3DD5FVi', 'admin', 'Administration', NULL, false, '2025-11-16 13:39:48.328021', '2026-01-13 20:24:35.187338', 'admin2') ON CONFLICT DO NOTHING;
INSERT INTO public.users VALUES (10, 'oseid abdulhakeem ', 'oseid@ipetro.com', '$2b$10$uR/wFqiFaYRVL09ScD75QuAoBaBxMHWOyTH4PjVs6sI3du8hgdKNC', 'inspector', '', '', true, '2026-01-13 20:25:28.295882', '2026-01-13 20:25:28.295882', 'oseid') ON CONFLICT DO NOTHING;
INSERT INTO public.users VALUES (11, 'hussein ', 'hussein@gmail.com', '$2b$10$.r9poQXW8Ta9..jRRv0WOOUjAJmMx6EeBgJ6soxjyyhqfjbgQxr8O', 'reviewer', '', '', true, '2026-01-13 20:26:06.915636', '2026-01-13 20:26:06.915636', 'hus') ON CONFLICT DO NOTHING;


--
-- TOC entry 3597 (class 0 OID 32795)
-- Dependencies: 217
-- Data for Name: vessels; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.vessels VALUES (5, 'V-001', 'Test Pressure Vessel', '1', 'Area A - Block 2', '{"material": "Carbon Steal", "year_built": "2014", "manufacturer": "Fabrication", "design_pressure": "150 psi", "design_temperature": "450F"}', '2025-11-20 15:35:48.732609', '2025-12-31 16:22:58.759939', 'Reactor', '1') ON CONFLICT DO NOTHING;
INSERT INTO public.vessels VALUES (3, 'HX-301', 'Shell and Tube Heat Exchanger', '3', 'Area C - Block 5', '{"material": "Carbon Steel", "design_pressure": "200 psi", "design_temperature": "350°F", "heat_transfer_area": "500 sq ft"}', '2025-11-17 07:30:20.677715', '2025-12-31 16:23:13.913684', 'Heat Exchanger', '1') ON CONFLICT DO NOTHING;
INSERT INTO public.vessels VALUES (2, 'R-201', 'Catalytic Reactor', '3', 'Area B - Block 3', '{"volume": "5000 gallons", "material": "Stainless Steel 316L", "design_pressure": "300 psi", "design_temperature": "600°F"}', '2025-11-17 07:30:09.274306', '2025-12-31 16:23:20.772859', 'Reactor', '1') ON CONFLICT DO NOTHING;
INSERT INTO public.vessels VALUES (8, 'B-101', '', '7', '', '{"material": "", "year_built": "", "manufacturer": "", "design_pressure": "", "design_temperature": ""}', '2026-01-13 20:28:14.715385', '2026-01-13 20:28:14.715385', 'Bullet', NULL) ON CONFLICT DO NOTHING;


--
-- TOC entry 3670 (class 0 OID 0)
-- Dependencies: 232
-- Name: activity_logs_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.activity_logs_log_id_seq', 391, true);


--
-- TOC entry 3671 (class 0 OID 0)
-- Dependencies: 239
-- Name: ai_report_analysis_analysis_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ai_report_analysis_analysis_id_seq', 8, true);


--
-- TOC entry 3672 (class 0 OID 0)
-- Dependencies: 235
-- Name: finding_templates_template_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.finding_templates_template_id_seq', 19, true);


--
-- TOC entry 3673 (class 0 OID 0)
-- Dependencies: 241
-- Name: findings_summary_summary_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.findings_summary_summary_id_seq', 4, true);


--
-- TOC entry 3674 (class 0 OID 0)
-- Dependencies: 218
-- Name: inspections_inspection_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.inspections_inspection_id_seq', 15, true);


--
-- TOC entry 3675 (class 0 OID 0)
-- Dependencies: 222
-- Name: observations_observation_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.observations_observation_id_seq', 40, true);


--
-- TOC entry 3676 (class 0 OID 0)
-- Dependencies: 220
-- Name: photos_photo_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.photos_photo_id_seq', 91, true);


--
-- TOC entry 3677 (class 0 OID 0)
-- Dependencies: 224
-- Name: presets_preset_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.presets_preset_id_seq', 1, false);


--
-- TOC entry 3678 (class 0 OID 0)
-- Dependencies: 237
-- Name: recommendation_templates_template_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.recommendation_templates_template_id_seq', 12, true);


--
-- TOC entry 3679 (class 0 OID 0)
-- Dependencies: 228
-- Name: reports_report_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.reports_report_id_seq', 1, false);


--
-- TOC entry 3680 (class 0 OID 0)
-- Dependencies: 230
-- Name: reviews_review_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.reviews_review_id_seq', 1, false);


--
-- TOC entry 3681 (class 0 OID 0)
-- Dependencies: 226
-- Name: templates_template_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.templates_template_id_seq', 1, false);


--
-- TOC entry 3682 (class 0 OID 0)
-- Dependencies: 214
-- Name: users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_user_id_seq', 11, true);


--
-- TOC entry 3683 (class 0 OID 0)
-- Dependencies: 216
-- Name: vessels_vessel_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.vessels_vessel_id_seq', 8, true);


--
-- TOC entry 3387 (class 2606 OID 32974)
-- Name: activity_logs activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (log_id);


--
-- TOC entry 3401 (class 2606 OID 57403)
-- Name: ai_report_analysis ai_report_analysis_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_report_analysis
    ADD CONSTRAINT ai_report_analysis_pkey PRIMARY KEY (analysis_id);


--
-- TOC entry 3393 (class 2606 OID 41191)
-- Name: finding_templates finding_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.finding_templates
    ADD CONSTRAINT finding_templates_pkey PRIMARY KEY (template_id);


--
-- TOC entry 3407 (class 2606 OID 57449)
-- Name: findings_summary findings_summary_inspection_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.findings_summary
    ADD CONSTRAINT findings_summary_inspection_id_key UNIQUE (inspection_id);


--
-- TOC entry 3409 (class 2606 OID 57447)
-- Name: findings_summary findings_summary_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.findings_summary
    ADD CONSTRAINT findings_summary_pkey PRIMARY KEY (summary_id);


--
-- TOC entry 3352 (class 2606 OID 32820)
-- Name: inspections inspections_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspections
    ADD CONSTRAINT inspections_pkey PRIMARY KEY (inspection_id);


--
-- TOC entry 3391 (class 2606 OID 41143)
-- Name: observation_photos observation_photos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.observation_photos
    ADD CONSTRAINT observation_photos_pkey PRIMARY KEY (observation_id, photo_id);


--
-- TOC entry 3375 (class 2606 OID 32867)
-- Name: observations observations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.observations
    ADD CONSTRAINT observations_pkey PRIMARY KEY (observation_id);


--
-- TOC entry 3361 (class 2606 OID 32845)
-- Name: photos photos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.photos
    ADD CONSTRAINT photos_pkey PRIMARY KEY (photo_id);


--
-- TOC entry 3377 (class 2606 OID 32894)
-- Name: presets presets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.presets
    ADD CONSTRAINT presets_pkey PRIMARY KEY (preset_id);


--
-- TOC entry 3399 (class 2606 OID 41207)
-- Name: recommendation_templates recommendation_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recommendation_templates
    ADD CONSTRAINT recommendation_templates_pkey PRIMARY KEY (template_id);


--
-- TOC entry 3382 (class 2606 OID 32928)
-- Name: reports reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_pkey PRIMARY KEY (report_id);


--
-- TOC entry 3385 (class 2606 OID 32954)
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (review_id);


--
-- TOC entry 3379 (class 2606 OID 32911)
-- Name: templates templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.templates
    ADD CONSTRAINT templates_pkey PRIMARY KEY (template_id);


--
-- TOC entry 3329 (class 2606 OID 32793)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 3331 (class 2606 OID 32791)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- TOC entry 3333 (class 2606 OID 40971)
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- TOC entry 3337 (class 2606 OID 32804)
-- Name: vessels vessels_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vessels
    ADD CONSTRAINT vessels_pkey PRIMARY KEY (vessel_id);


--
-- TOC entry 3339 (class 2606 OID 32806)
-- Name: vessels vessels_tag_no_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vessels
    ADD CONSTRAINT vessels_tag_no_key UNIQUE (tag_no);


--
-- TOC entry 3402 (class 1259 OID 57415)
-- Name: idx_ai_analysis_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_analysis_date ON public.ai_report_analysis USING btree (analyzed_at DESC);


--
-- TOC entry 3403 (class 1259 OID 57414)
-- Name: idx_ai_analysis_inspection; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_analysis_inspection ON public.ai_report_analysis USING btree (inspection_id);


--
-- TOC entry 3404 (class 1259 OID 65668)
-- Name: idx_ai_analysis_inspection_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_analysis_inspection_type ON public.ai_report_analysis USING btree (inspection_id, analysis_type, analyzed_at DESC);


--
-- TOC entry 3405 (class 1259 OID 65667)
-- Name: idx_ai_analysis_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_analysis_type ON public.ai_report_analysis USING btree (analysis_type);


--
-- TOC entry 3394 (class 1259 OID 41215)
-- Name: idx_finding_templates_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_finding_templates_active ON public.finding_templates USING btree (is_active);


--
-- TOC entry 3395 (class 1259 OID 41214)
-- Name: idx_finding_templates_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_finding_templates_type ON public.finding_templates USING btree (observation_type);


--
-- TOC entry 3410 (class 1259 OID 57465)
-- Name: idx_findings_summary_inspection; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_findings_summary_inspection ON public.findings_summary USING btree (inspection_id);


--
-- TOC entry 3411 (class 1259 OID 57466)
-- Name: idx_findings_summary_vessel; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_findings_summary_vessel ON public.findings_summary USING btree (vessel_id);


--
-- TOC entry 3340 (class 1259 OID 57475)
-- Name: idx_inspections_dosh_registration; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inspections_dosh_registration ON public.inspections USING btree (dosh_registration);


--
-- TOC entry 3341 (class 1259 OID 40985)
-- Name: idx_inspections_due_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inspections_due_date ON public.inspections USING btree (due_date);


--
-- TOC entry 3342 (class 1259 OID 40986)
-- Name: idx_inspections_is_overdue; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inspections_is_overdue ON public.inspections USING btree (is_overdue);


--
-- TOC entry 3343 (class 1259 OID 40983)
-- Name: idx_inspections_priority; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inspections_priority ON public.inspections USING btree (priority);


--
-- TOC entry 3344 (class 1259 OID 41175)
-- Name: idx_inspections_report_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inspections_report_number ON public.inspections USING btree (report_number);


--
-- TOC entry 3345 (class 1259 OID 57390)
-- Name: idx_inspections_report_reviewed_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inspections_report_reviewed_by ON public.inspections USING btree (report_reviewed_by);


--
-- TOC entry 3346 (class 1259 OID 57389)
-- Name: idx_inspections_report_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inspections_report_status ON public.inspections USING btree (report_status);


--
-- TOC entry 3347 (class 1259 OID 40984)
-- Name: idx_inspections_scheduled_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inspections_scheduled_date ON public.inspections USING btree (scheduled_date);


--
-- TOC entry 3348 (class 1259 OID 32981)
-- Name: idx_inspections_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inspections_status ON public.inspections USING btree (status);


--
-- TOC entry 3349 (class 1259 OID 40982)
-- Name: idx_inspections_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inspections_type ON public.inspections USING btree (inspection_type);


--
-- TOC entry 3350 (class 1259 OID 32980)
-- Name: idx_inspections_vessel_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inspections_vessel_id ON public.inspections USING btree (vessel_id);


--
-- TOC entry 3388 (class 1259 OID 41164)
-- Name: idx_observation_photos_observation; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_observation_photos_observation ON public.observation_photos USING btree (observation_id);


--
-- TOC entry 3389 (class 1259 OID 41165)
-- Name: idx_observation_photos_photo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_observation_photos_photo ON public.observation_photos USING btree (photo_id);


--
-- TOC entry 3362 (class 1259 OID 41160)
-- Name: idx_observations_component; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_observations_component ON public.observations USING btree (component);


--
-- TOC entry 3363 (class 1259 OID 41161)
-- Name: idx_observations_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_observations_created_at ON public.observations USING btree (created_at);


--
-- TOC entry 3364 (class 1259 OID 41162)
-- Name: idx_observations_due_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_observations_due_date ON public.observations USING btree (due_date);


--
-- TOC entry 3365 (class 1259 OID 41163)
-- Name: idx_observations_followup_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_observations_followup_status ON public.observations USING btree (follow_up_status);


--
-- TOC entry 3366 (class 1259 OID 41154)
-- Name: idx_observations_inspection; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_observations_inspection ON public.observations USING btree (inspection_id);


--
-- TOC entry 3367 (class 1259 OID 32983)
-- Name: idx_observations_inspection_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_observations_inspection_id ON public.observations USING btree (inspection_id);


--
-- TOC entry 3368 (class 1259 OID 41159)
-- Name: idx_observations_priority; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_observations_priority ON public.observations USING btree (priority);


--
-- TOC entry 3369 (class 1259 OID 57429)
-- Name: idx_observations_section; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_observations_section ON public.observations USING btree (section);


--
-- TOC entry 3370 (class 1259 OID 41157)
-- Name: idx_observations_severity; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_observations_severity ON public.observations USING btree (severity);


--
-- TOC entry 3371 (class 1259 OID 41158)
-- Name: idx_observations_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_observations_status ON public.observations USING btree (status);


--
-- TOC entry 3372 (class 1259 OID 41156)
-- Name: idx_observations_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_observations_type ON public.observations USING btree (observation_type);


--
-- TOC entry 3373 (class 1259 OID 41155)
-- Name: idx_observations_vessel; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_observations_vessel ON public.observations USING btree (vessel_id);


--
-- TOC entry 3353 (class 1259 OID 40995)
-- Name: idx_photos_component; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_photos_component ON public.photos USING btree (component);


--
-- TOC entry 3354 (class 1259 OID 49192)
-- Name: idx_photos_group; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_photos_group ON public.photos USING btree (photo_group);


--
-- TOC entry 3355 (class 1259 OID 49191)
-- Name: idx_photos_inspection; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_photos_inspection ON public.photos USING btree (inspection_id);


--
-- TOC entry 3356 (class 1259 OID 32982)
-- Name: idx_photos_inspection_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_photos_inspection_id ON public.photos USING btree (inspection_id);


--
-- TOC entry 3357 (class 1259 OID 57381)
-- Name: idx_photos_tag_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_photos_tag_number ON public.photos USING btree (tag_number);


--
-- TOC entry 3358 (class 1259 OID 40996)
-- Name: idx_photos_uploaded_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_photos_uploaded_at ON public.photos USING btree (uploaded_at);


--
-- TOC entry 3359 (class 1259 OID 49193)
-- Name: idx_photos_uploaded_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_photos_uploaded_by ON public.photos USING btree (uploaded_by);


--
-- TOC entry 3396 (class 1259 OID 41216)
-- Name: idx_recommendation_templates_action; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_recommendation_templates_action ON public.recommendation_templates USING btree (action_required);


--
-- TOC entry 3397 (class 1259 OID 41217)
-- Name: idx_recommendation_templates_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_recommendation_templates_active ON public.recommendation_templates USING btree (is_active);


--
-- TOC entry 3380 (class 1259 OID 32984)
-- Name: idx_reports_inspection_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reports_inspection_id ON public.reports USING btree (inspection_id);


--
-- TOC entry 3383 (class 1259 OID 32985)
-- Name: idx_reviews_inspection_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reviews_inspection_id ON public.reviews USING btree (inspection_id);


--
-- TOC entry 3327 (class 1259 OID 40972)
-- Name: idx_users_username; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_username ON public.users USING btree (username);


--
-- TOC entry 3334 (class 1259 OID 40975)
-- Name: idx_vessels_tag_no; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vessels_tag_no ON public.vessels USING btree (tag_no);


--
-- TOC entry 3335 (class 1259 OID 40974)
-- Name: idx_vessels_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vessels_type ON public.vessels USING btree (vessel_type);


--
-- TOC entry 3451 (class 2620 OID 57468)
-- Name: findings_summary findings_summary_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER findings_summary_updated_at BEFORE UPDATE ON public.findings_summary FOR EACH ROW EXECUTE FUNCTION public.update_findings_summary_timestamp();


--
-- TOC entry 3446 (class 2620 OID 40993)
-- Name: inspections trigger_update_inspection_overdue; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_inspection_overdue BEFORE INSERT OR UPDATE ON public.inspections FOR EACH ROW EXECUTE FUNCTION public.update_inspection_overdue();


--
-- TOC entry 3448 (class 2620 OID 41169)
-- Name: observations trigger_update_observation_overdue; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_observation_overdue BEFORE INSERT OR UPDATE ON public.observations FOR EACH ROW EXECUTE FUNCTION public.update_observation_overdue();


--
-- TOC entry 3449 (class 2620 OID 41167)
-- Name: observations trigger_update_observation_timestamp; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_observation_timestamp BEFORE UPDATE ON public.observations FOR EACH ROW EXECUTE FUNCTION public.update_observation_timestamp();


--
-- TOC entry 3447 (class 2620 OID 32989)
-- Name: inspections update_inspection_modtime; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_inspection_modtime BEFORE UPDATE ON public.inspections FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();


--
-- TOC entry 3450 (class 2620 OID 32990)
-- Name: observations update_observation_modtime; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_observation_modtime BEFORE UPDATE ON public.observations FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();


--
-- TOC entry 3444 (class 2620 OID 32987)
-- Name: users update_user_modtime; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_user_modtime BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();


--
-- TOC entry 3445 (class 2620 OID 32988)
-- Name: vessels update_vessel_modtime; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_vessel_modtime BEFORE UPDATE ON public.vessels FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();


--
-- TOC entry 3434 (class 2606 OID 32975)
-- Name: activity_logs activity_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- TOC entry 3439 (class 2606 OID 57409)
-- Name: ai_report_analysis ai_report_analysis_analyzed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_report_analysis
    ADD CONSTRAINT ai_report_analysis_analyzed_by_fkey FOREIGN KEY (analyzed_by) REFERENCES public.users(user_id);


--
-- TOC entry 3440 (class 2606 OID 57404)
-- Name: ai_report_analysis ai_report_analysis_inspection_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_report_analysis
    ADD CONSTRAINT ai_report_analysis_inspection_id_fkey FOREIGN KEY (inspection_id) REFERENCES public.inspections(inspection_id) ON DELETE CASCADE;


--
-- TOC entry 3437 (class 2606 OID 41192)
-- Name: finding_templates finding_templates_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.finding_templates
    ADD CONSTRAINT finding_templates_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id);


--
-- TOC entry 3441 (class 2606 OID 57460)
-- Name: findings_summary findings_summary_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.findings_summary
    ADD CONSTRAINT findings_summary_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id);


--
-- TOC entry 3442 (class 2606 OID 57450)
-- Name: findings_summary findings_summary_inspection_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.findings_summary
    ADD CONSTRAINT findings_summary_inspection_id_fkey FOREIGN KEY (inspection_id) REFERENCES public.inspections(inspection_id) ON DELETE CASCADE;


--
-- TOC entry 3443 (class 2606 OID 57455)
-- Name: findings_summary findings_summary_vessel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.findings_summary
    ADD CONSTRAINT findings_summary_vessel_id_fkey FOREIGN KEY (vessel_id) REFERENCES public.vessels(vessel_id) ON DELETE CASCADE;


--
-- TOC entry 3422 (class 2606 OID 41122)
-- Name: observations fk_follow_up_inspection; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.observations
    ADD CONSTRAINT fk_follow_up_inspection FOREIGN KEY (follow_up_inspection_id) REFERENCES public.inspections(inspection_id) ON DELETE SET NULL;


--
-- TOC entry 3412 (class 2606 OID 40987)
-- Name: inspections fk_previous_inspection; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspections
    ADD CONSTRAINT fk_previous_inspection FOREIGN KEY (previous_inspection_id) REFERENCES public.inspections(inspection_id) ON DELETE SET NULL;


--
-- TOC entry 3423 (class 2606 OID 41127)
-- Name: observations fk_previous_observation; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.observations
    ADD CONSTRAINT fk_previous_observation FOREIGN KEY (previous_observation_id) REFERENCES public.observations(observation_id) ON DELETE SET NULL;


--
-- TOC entry 3413 (class 2606 OID 41176)
-- Name: inspections fk_report_generated_by; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspections
    ADD CONSTRAINT fk_report_generated_by FOREIGN KEY (report_generated_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3424 (class 2606 OID 41132)
-- Name: observations fk_reviewed_by; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.observations
    ADD CONSTRAINT fk_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3414 (class 2606 OID 32826)
-- Name: inspections inspections_inspector_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspections
    ADD CONSTRAINT inspections_inspector_id_fkey FOREIGN KEY (inspector_id) REFERENCES public.users(user_id);


--
-- TOC entry 3415 (class 2606 OID 57416)
-- Name: inspections inspections_last_ai_analysis_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspections
    ADD CONSTRAINT inspections_last_ai_analysis_id_fkey FOREIGN KEY (last_ai_analysis_id) REFERENCES public.ai_report_analysis(analysis_id);


--
-- TOC entry 3416 (class 2606 OID 41170)
-- Name: inspections inspections_report_generated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspections
    ADD CONSTRAINT inspections_report_generated_by_fkey FOREIGN KEY (report_generated_by) REFERENCES public.users(user_id);


--
-- TOC entry 3417 (class 2606 OID 57384)
-- Name: inspections inspections_report_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspections
    ADD CONSTRAINT inspections_report_reviewed_by_fkey FOREIGN KEY (report_reviewed_by) REFERENCES public.users(user_id);


--
-- TOC entry 3418 (class 2606 OID 32831)
-- Name: inspections inspections_reviewer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspections
    ADD CONSTRAINT inspections_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.users(user_id);


--
-- TOC entry 3419 (class 2606 OID 32821)
-- Name: inspections inspections_vessel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspections
    ADD CONSTRAINT inspections_vessel_id_fkey FOREIGN KEY (vessel_id) REFERENCES public.vessels(vessel_id) ON DELETE CASCADE;


--
-- TOC entry 3435 (class 2606 OID 41144)
-- Name: observation_photos observation_photos_observation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.observation_photos
    ADD CONSTRAINT observation_photos_observation_id_fkey FOREIGN KEY (observation_id) REFERENCES public.observations(observation_id) ON DELETE CASCADE;


--
-- TOC entry 3436 (class 2606 OID 41149)
-- Name: observation_photos observation_photos_photo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.observation_photos
    ADD CONSTRAINT observation_photos_photo_id_fkey FOREIGN KEY (photo_id) REFERENCES public.photos(photo_id) ON DELETE CASCADE;


--
-- TOC entry 3425 (class 2606 OID 32878)
-- Name: observations observations_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.observations
    ADD CONSTRAINT observations_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id);


--
-- TOC entry 3426 (class 2606 OID 32868)
-- Name: observations observations_inspection_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.observations
    ADD CONSTRAINT observations_inspection_id_fkey FOREIGN KEY (inspection_id) REFERENCES public.inspections(inspection_id) ON DELETE CASCADE;


--
-- TOC entry 3420 (class 2606 OID 32846)
-- Name: photos photos_inspection_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.photos
    ADD CONSTRAINT photos_inspection_id_fkey FOREIGN KEY (inspection_id) REFERENCES public.inspections(inspection_id) ON DELETE CASCADE;


--
-- TOC entry 3421 (class 2606 OID 32851)
-- Name: photos photos_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.photos
    ADD CONSTRAINT photos_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(user_id);


--
-- TOC entry 3427 (class 2606 OID 32895)
-- Name: presets presets_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.presets
    ADD CONSTRAINT presets_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id);


--
-- TOC entry 3438 (class 2606 OID 41208)
-- Name: recommendation_templates recommendation_templates_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recommendation_templates
    ADD CONSTRAINT recommendation_templates_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id);


--
-- TOC entry 3429 (class 2606 OID 32939)
-- Name: reports reports_generated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_generated_by_fkey FOREIGN KEY (generated_by) REFERENCES public.users(user_id);


--
-- TOC entry 3430 (class 2606 OID 32929)
-- Name: reports reports_inspection_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_inspection_id_fkey FOREIGN KEY (inspection_id) REFERENCES public.inspections(inspection_id) ON DELETE CASCADE;


--
-- TOC entry 3431 (class 2606 OID 32934)
-- Name: reports reports_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.templates(template_id);


--
-- TOC entry 3432 (class 2606 OID 32955)
-- Name: reviews reviews_inspection_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_inspection_id_fkey FOREIGN KEY (inspection_id) REFERENCES public.inspections(inspection_id) ON DELETE CASCADE;


--
-- TOC entry 3433 (class 2606 OID 32960)
-- Name: reviews reviews_reviewer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.users(user_id);


--
-- TOC entry 3428 (class 2606 OID 32912)
-- Name: templates templates_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.templates
    ADD CONSTRAINT templates_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id);


-- Completed on 2026-01-14 21:30:21

--
-- PostgreSQL database dump complete
--

