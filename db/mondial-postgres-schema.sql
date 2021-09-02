--
-- PostgreSQL database dump
--

-- Dumped from database version 12.5
-- Dumped by pg_dump version 12.4

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
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


SET default_table_access_method = heap;

--
-- Name: airport; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.airport (
    iata_code character varying(3) NOT NULL,
    name character varying(100),
    country character varying(4),
    city character varying(48),
    province character varying(48),
    island character varying(50),
    latitude numeric(5,2) NOT NULL,
    longitude numeric(5,2) NOT NULL,
    elevation integer,
    gmt_offset integer,
    CONSTRAINT airport_latitude_range CHECK (((latitude >= ('-90'::integer)::numeric) AND (latitude <= (90)::numeric))),
    CONSTRAINT airport_longtitude_range CHECK (((longitude >= ('-180'::integer)::numeric) AND (longitude <= (180)::numeric)))
);


--
-- Name: borders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.borders (
    country1 character varying(4) NOT NULL,
    country2 character varying(4) NOT NULL,
    length numeric(10,2) NOT NULL,
    CONSTRAINT border_length CHECK ((length > (0)::numeric))
);


--
-- Name: city; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.city (
    name character varying(48) NOT NULL,
    country character varying(4) NOT NULL,
    province character varying(48) NOT NULL,
    population numeric,
    latitude numeric(5,2) NOT NULL,
    longitude numeric(5,2) NOT NULL,
    elevation integer,
    CONSTRAINT city_latitude_range CHECK (((latitude >= ('-90'::integer)::numeric) AND (latitude <= (90)::numeric))),
    CONSTRAINT city_longtitude_range CHECK (((longitude >= ('-180'::integer)::numeric) AND (longitude <= (180)::numeric))),
    CONSTRAINT city_population_range CHECK ((population >= (0)::numeric))
);


--
-- Name: city_local_name; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.city_local_name (
    city character varying(50) NOT NULL,
    country character varying(4) NOT NULL,
    province character varying(48) NOT NULL,
    local_name character varying(120)
);


--
-- Name: city_other_name; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.city_other_name (
    city character varying(48) NOT NULL,
    country character varying(4) NOT NULL,
    province character varying(48) NOT NULL,
    other_name character varying(50) NOT NULL
);


--
-- Name: city_population; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.city_population (
    city character varying(48) NOT NULL,
    country character varying(4) NOT NULL,
    province character varying(48) NOT NULL,
    year numeric NOT NULL,
    population numeric,
    CONSTRAINT city_population_population_range CHECK ((population >= (0)::numeric)),
    CONSTRAINT city_population_year_range CHECK ((year >= (0)::numeric))
);


--
-- Name: continent; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.continent (
    name character varying(20) NOT NULL,
    area numeric(10,2) NOT NULL
);


--
-- Name: country; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.country (
    name character varying(32) NOT NULL,
    code character varying(4) NOT NULL,
    capital character varying(35),
    province character varying(32),
    area numeric(10,2) NOT NULL,
    population integer NOT NULL,
    CONSTRAINT country_area_range CHECK ((area >= (0)::numeric)),
    CONSTRAINT country_population_range CHECK ((population >= 0))
);


--
-- Name: country_local_name; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.country_local_name (
    country character varying(4) NOT NULL,
    local_name character varying(120)
);


--
-- Name: country_other_name; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.country_other_name (
    country character varying(4) NOT NULL,
    other_name character varying(48) NOT NULL
);


--
-- Name: country_population; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.country_population (
    country character varying(4) NOT NULL,
    year integer NOT NULL,
    population integer,
    CONSTRAINT country_population_population CHECK ((population >= 0)),
    CONSTRAINT country_population_year CHECK ((year >= 0))
);


--
-- Name: desert; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.desert (
    name character varying(25) NOT NULL,
    area numeric(10,2),
    latitude numeric(4,1),
    longitude numeric(4,1),
    CONSTRAINT desert_latitude CHECK (((latitude >= ('-90'::integer)::numeric) AND (latitude <= (90)::numeric))),
    CONSTRAINT desert_longtitude CHECK (((longitude >= ('-180'::integer)::numeric) AND (longitude <= (180)::numeric)))
);


--
-- Name: economy; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.economy (
    country character varying(4) NOT NULL,
    gdp integer,
    agriculture numeric(5,2),
    service numeric(5,2),
    industry numeric(5,2),
    inflation numeric(5,2),
    unemployment numeric(5,2),
    CONSTRAINT economy_gdp CHECK ((gdp >= 0))
);


--
-- Name: encompasses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.encompasses (
    country character varying(4) NOT NULL,
    continent character varying(20) NOT NULL,
    percentage numeric(10,2) NOT NULL,
    CONSTRAINT encompasses_percentage_range CHECK (((percentage >= (0)::numeric) AND (percentage <= (100)::numeric)))
);


--
-- Name: ethnic_group; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ethnic_group (
    country character varying(4) NOT NULL,
    name character varying(50) NOT NULL,
    percentage numeric,
    CONSTRAINT ethnic_group_percent_range CHECK (((percentage >= (0)::numeric) AND (percentage <= (100)::numeric)))
);


--
-- Name: geo_desert; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.geo_desert (
    desert character varying(25) NOT NULL,
    country character varying(4) NOT NULL,
    province character varying(32) NOT NULL
);


--
-- Name: geo_estuary; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.geo_estuary (
    river character varying(32) NOT NULL,
    country character varying(4) NOT NULL,
    province character varying(48) NOT NULL
);


--
-- Name: geo_island; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.geo_island (
    island character varying(32) NOT NULL,
    country character varying(4) NOT NULL,
    province character varying(48) NOT NULL
);


--
-- Name: geo_lake; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.geo_lake (
    lake character varying(32) NOT NULL,
    country character varying(4) NOT NULL,
    province character varying(48) NOT NULL
);


--
-- Name: geo_mountain; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.geo_mountain (
    mountain character varying(32) NOT NULL,
    country character varying(4) NOT NULL,
    province character varying(48) NOT NULL
);


--
-- Name: geo_river; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.geo_river (
    river character varying(32) NOT NULL,
    country character varying(4) NOT NULL,
    province character varying(48) NOT NULL
);


--
-- Name: geo_sea; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.geo_sea (
    sea character varying(32) NOT NULL,
    country character varying(4) NOT NULL,
    province character varying(48) NOT NULL
);


--
-- Name: geo_source; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.geo_source (
    river character varying(32) NOT NULL,
    country character varying(4) NOT NULL,
    province character varying(48) NOT NULL
);


--
-- Name: is_member; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.is_member (
    country character varying(4) NOT NULL,
    organization character varying(12) NOT NULL,
    type character varying(64) DEFAULT 'member'::character varying NOT NULL
);


--
-- Name: island; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.island (
    name character varying(32) NOT NULL,
    islands character varying(32),
    area numeric(10,2),
    elevation integer,
    type character varying(10),
    latitude numeric(4,1),
    longitude numeric(4,1),
    CONSTRAINT island_area CHECK (((area >= (0)::numeric) AND (area <= (2175600)::numeric))),
    CONSTRAINT island_latitude CHECK (((latitude >= ('-90'::integer)::numeric) AND (latitude <= (90)::numeric))),
    CONSTRAINT island_longtitude CHECK (((longitude >= ('-180'::integer)::numeric) AND (longitude <= (180)::numeric)))
);


--
-- Name: island_in; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.island_in (
    island character varying(32),
    sea character varying(50),
    lake character varying(32),
    river character varying(32)
);


--
-- Name: lake; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lake (
    name character varying(32) NOT NULL,
    river character varying(32),
    area integer,
    elevation integer,
    depth integer,
    dam_height integer,
    type character varying(12),
    latitude numeric(5,2) NOT NULL,
    longitude numeric(5,2) NOT NULL,
    CONSTRAINT lake_area CHECK ((area >= 0)),
    CONSTRAINT lake_dam_height CHECK ((dam_height >= 0)),
    CONSTRAINT lake_depth CHECK ((depth >= 0)),
    CONSTRAINT lake_latitude CHECK (((latitude >= ('-90'::integer)::numeric) AND (latitude <= (90)::numeric))),
    CONSTRAINT lake_longtitude CHECK (((longitude >= ('-180'::integer)::numeric) AND (longitude <= (180)::numeric)))
);


--
-- Name: lake_on_island; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lake_on_island (
    lake character varying(32) NOT NULL,
    island character varying(32)
);


--
-- Name: language; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.language (
    country character varying(4) NOT NULL,
    name character varying(50) NOT NULL,
    percentage numeric(4,1),
    CONSTRAINT language_percent_range CHECK (((percentage >= (0)::numeric) AND (percentage <= (100)::numeric)))
);


--
-- Name: located; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.located (
    city character varying(35) NOT NULL,
    province character varying(48) NOT NULL,
    country character varying(4) NOT NULL,
    river character varying(32),
    lake character varying(32),
    sea character varying(32)
);


--
-- Name: located_on; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.located_on (
    city character varying(35) NOT NULL,
    province character varying(48) NOT NULL,
    country character varying(4) NOT NULL,
    island character varying(32) NOT NULL
);


--
-- Name: merges_with; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.merges_with (
    sea1 character varying(32) NOT NULL,
    sea2 character varying(32) NOT NULL
);


--
-- Name: mountain; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mountain (
    name character varying(32) NOT NULL,
    mountains character varying(50),
    elevation numeric(10,2) NOT NULL,
    type character varying(10),
    latitude numeric(4,1) NOT NULL,
    longitude numeric(4,1) NOT NULL,
    CONSTRAINT mountain_elevation_range CHECK ((elevation >= (0)::numeric)),
    CONSTRAINT mountain_latitude_range CHECK (((latitude >= ('-90'::integer)::numeric) AND (latitude <= (90)::numeric))),
    CONSTRAINT mountain_longtitude_range CHECK (((longitude >= ('-180'::integer)::numeric) AND (longitude <= (180)::numeric)))
);


--
-- Name: mountain_on_island; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mountain_on_island (
    mountain character varying(50) NOT NULL,
    island character varying(32) NOT NULL
);


--
-- Name: organization; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.organization (
    abbreviation character varying(12) NOT NULL,
    name character varying(100) NOT NULL,
    city character varying(35),
    country character varying(4),
    province character varying(32),
    established date
);


--
-- Name: politics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.politics (
    country character varying(4) NOT NULL,
    independence date,
    was_dependent character varying(32),
    dependent character varying(4),
    government character varying(120)
);


--
-- Name: population; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.population (
    country character varying(4) NOT NULL,
    population_growth numeric(5,2),
    infant_mortality numeric(5,2)
);


--
-- Name: province; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.province (
    name character varying(48) NOT NULL,
    country character varying(4) NOT NULL,
    population integer,
    area integer,
    capital character varying(50),
    capital_province character varying(48),
    CONSTRAINT province_area_range CHECK ((area >= 0)),
    CONSTRAINT province_population_range CHECK ((population >= 0))
);


--
-- Name: province_local_name; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.province_local_name (
    province character varying(48) NOT NULL,
    country character varying(4) NOT NULL,
    local_name character varying(120)
);


--
-- Name: province_other_name; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.province_other_name (
    province character varying(48) NOT NULL,
    country character varying(4) NOT NULL,
    other_name character varying(48) NOT NULL
);


--
-- Name: province_population; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.province_population (
    province character varying(48) NOT NULL,
    country character varying(4) NOT NULL,
    year integer NOT NULL,
    population numeric,
    CONSTRAINT province_population_population_range CHECK ((population >= (0)::numeric)),
    CONSTRAINT province_population_year_range CHECK ((year >= 0))
);


--
-- Name: religion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.religion (
    country character varying(4) NOT NULL,
    name character varying(50) NOT NULL,
    percentage numeric,
    CONSTRAINT religion_percent_range CHECK (((percentage >= (0)::numeric) AND (percentage <= (100)::numeric)))
);


--
-- Name: river; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.river (
    name character varying(32) NOT NULL,
    river character varying(32),
    lake character varying(32),
    sea character varying(32),
    length numeric(10,2),
    area numeric,
    source_latitude numeric(5,2) NOT NULL,
    source_longitude numeric(5,2) NOT NULL,
    mountains character varying(50),
    source_elevation numeric,
    estuary_latitude numeric(5,2) NOT NULL,
    estuary_longitude numeric(5,2) NOT NULL,
    estuary_elevation numeric,
    CONSTRAINT estuary_latitude_range CHECK (((estuary_latitude >= ('-90'::integer)::numeric) AND (estuary_latitude <= (90)::numeric))),
    CONSTRAINT estuary_longtitude_range CHECK (((estuary_longitude >= ('-180'::integer)::numeric) AND (estuary_longitude <= (180)::numeric))),
    CONSTRAINT river_area_range CHECK ((area >= (0)::numeric)),
    CONSTRAINT river_flows_into CHECK ((((river IS NULL) AND (lake IS NULL)) OR ((river IS NULL) AND (sea IS NULL)) OR ((lake IS NULL) AND (sea IS NULL)))),
    CONSTRAINT river_length_range CHECK ((length >= (0)::numeric)),
    CONSTRAINT source_latitude_range CHECK (((source_latitude >= ('-90'::integer)::numeric) AND (source_latitude <= (90)::numeric))),
    CONSTRAINT source_longtitude_range CHECK (((source_longitude >= ('-180'::integer)::numeric) AND (source_longitude <= (180)::numeric)))
);


--
-- Name: river_on_island; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.river_on_island (
    river character varying(32) NOT NULL,
    island character varying(32)
);


--
-- Name: river_through; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.river_through (
    river character varying(32) NOT NULL,
    lake character varying(32) NOT NULL
);


--
-- Name: sea; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sea (
    name character varying(32) NOT NULL,
    area integer,
    depth integer,
    CONSTRAINT sea_area CHECK ((area >= 0)),
    CONSTRAINT sea_depth CHECK ((depth >= 0))
);


--
-- Name: ws_country; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.ws_country AS
 SELECT country.name,
    country.code,
    country.capital,
    country.area,
    country.population
   FROM public.country
  WHERE ((country.code)::text = ANY ((ARRAY['AUS'::character varying, 'NZ'::character varying, 'USA'::character varying, 'N'::character varying, 'S'::character varying, 'IS'::character varying, 'DK'::character varying, 'SF'::character varying, 'DK'::character varying, 'FL'::character varying, 'CH'::character varying])::text[]));


--
-- Name: ws_encompasses; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.ws_encompasses AS
 SELECT encompasses.country,
    encompasses.continent,
    encompasses.percentage
   FROM public.encompasses
  WHERE ((encompasses.country)::text IN ( SELECT ws_country.code
           FROM public.ws_country));


--
-- Name: ws_organization; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.ws_organization AS
 SELECT organization.abbreviation,
    organization.city,
    organization.established
   FROM public.organization
  WHERE ((organization.abbreviation)::text = ANY ((ARRAY['EFTA'::character varying, 'NC'::character varying, 'ANZUS'::character varying, 'NATO'::character varying])::text[]));


--
-- Name: ws_is_member; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.ws_is_member AS
 SELECT is_member.country,
    is_member.organization
   FROM public.is_member
  WHERE (((is_member.country)::text IN ( SELECT ws_country.code
           FROM public.ws_country)) AND ((is_member.organization)::text IN ( SELECT ws_organization.abbreviation
           FROM public.ws_organization)));


--
-- Name: ws_located; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.ws_located AS
 SELECT located.city,
    located.province,
    located.country,
    located.river,
    located.lake,
    located.sea
   FROM public.located
  WHERE ((located.country)::text IN ( SELECT ws_country.code
           FROM public.ws_country));


--
-- Name: airport airport_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.airport
    ADD CONSTRAINT airport_pkey PRIMARY KEY (iata_code);


--
-- Name: borders border_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.borders
    ADD CONSTRAINT border_pk PRIMARY KEY (country1, country2);


--
-- Name: city_local_name city_local_name_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.city_local_name
    ADD CONSTRAINT city_local_name_pk PRIMARY KEY (country, province, city);


--
-- Name: city_other_name city_other_name_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.city_other_name
    ADD CONSTRAINT city_other_name_pk PRIMARY KEY (country, province, city, other_name);


--
-- Name: city city_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.city
    ADD CONSTRAINT city_pk PRIMARY KEY (name, province, country);


--
-- Name: city_population city_population_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.city_population
    ADD CONSTRAINT city_population_pk PRIMARY KEY (country, province, city, year);


--
-- Name: continent continent_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.continent
    ADD CONSTRAINT continent_pk PRIMARY KEY (name);


--
-- Name: country_local_name country_local_name_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.country_local_name
    ADD CONSTRAINT country_local_name_pk PRIMARY KEY (country);


--
-- Name: country country_name_ck; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.country
    ADD CONSTRAINT country_name_ck UNIQUE (name);


--
-- Name: country_other_name country_other_name_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.country_other_name
    ADD CONSTRAINT country_other_name_pk PRIMARY KEY (country, other_name);


--
-- Name: country country_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.country
    ADD CONSTRAINT country_pk PRIMARY KEY (code);


--
-- Name: country_population country_population_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.country_population
    ADD CONSTRAINT country_population_pk PRIMARY KEY (country, year);


--
-- Name: desert desert_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.desert
    ADD CONSTRAINT desert_pk PRIMARY KEY (name);


--
-- Name: economy economy_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.economy
    ADD CONSTRAINT economy_pk PRIMARY KEY (country);


--
-- Name: encompasses encompasses_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.encompasses
    ADD CONSTRAINT encompasses_pk PRIMARY KEY (country, continent);


--
-- Name: ethnic_group ethnic_group_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ethnic_group
    ADD CONSTRAINT ethnic_group_pk PRIMARY KEY (name, country);


--
-- Name: geo_desert geo_desert_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.geo_desert
    ADD CONSTRAINT geo_desert_pk PRIMARY KEY (province, country, desert);


--
-- Name: geo_estuary geo_estuary_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.geo_estuary
    ADD CONSTRAINT geo_estuary_pk PRIMARY KEY (province, country, river);


--
-- Name: geo_island geo_island_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.geo_island
    ADD CONSTRAINT geo_island_pk PRIMARY KEY (province, country, island);


--
-- Name: geo_lake geo_lake_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.geo_lake
    ADD CONSTRAINT geo_lake_pk PRIMARY KEY (province, country, lake);


--
-- Name: geo_mountain geo_mountain_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.geo_mountain
    ADD CONSTRAINT geo_mountain_pk PRIMARY KEY (province, country, mountain);


--
-- Name: geo_river geo_river_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.geo_river
    ADD CONSTRAINT geo_river_pk PRIMARY KEY (province, country, river);


--
-- Name: geo_sea geo_sea_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.geo_sea
    ADD CONSTRAINT geo_sea_pk PRIMARY KEY (province, country, sea);


--
-- Name: geo_source geo_source_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.geo_source
    ADD CONSTRAINT geo_source_pk PRIMARY KEY (province, country, river);


--
-- Name: is_member is_member_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.is_member
    ADD CONSTRAINT is_member_pk PRIMARY KEY (country, organization);


--
-- Name: island island_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.island
    ADD CONSTRAINT island_pk PRIMARY KEY (name);


--
-- Name: lake_on_island lake_on_island_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lake_on_island
    ADD CONSTRAINT lake_on_island_pk PRIMARY KEY (lake);


--
-- Name: lake lake_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lake
    ADD CONSTRAINT lake_pk PRIMARY KEY (name);


--
-- Name: language language_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.language
    ADD CONSTRAINT language_pk PRIMARY KEY (name, country);


--
-- Name: located_on located_on_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.located_on
    ADD CONSTRAINT located_on_pk PRIMARY KEY (city, province, country, island);


--
-- Name: merges_with merges_with_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.merges_with
    ADD CONSTRAINT merges_with_pk PRIMARY KEY (sea1, sea2);


--
-- Name: mountain_on_island mountain_on_island_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mountain_on_island
    ADD CONSTRAINT mountain_on_island_pk PRIMARY KEY (mountain);


--
-- Name: mountain mountain_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mountain
    ADD CONSTRAINT mountain_pk PRIMARY KEY (name);


--
-- Name: organization organization_name_ck; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization
    ADD CONSTRAINT organization_name_ck UNIQUE (name);


--
-- Name: organization organization_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization
    ADD CONSTRAINT organization_pk PRIMARY KEY (abbreviation);


--
-- Name: politics politics_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.politics
    ADD CONSTRAINT politics_pk PRIMARY KEY (country);


--
-- Name: population population_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.population
    ADD CONSTRAINT population_pk PRIMARY KEY (country);


--
-- Name: province_local_name province_local_name_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.province_local_name
    ADD CONSTRAINT province_local_name_pk PRIMARY KEY (country, province);


--
-- Name: province_other_name province_other_name_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.province_other_name
    ADD CONSTRAINT province_other_name_pk PRIMARY KEY (country, province, other_name);


--
-- Name: province province_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.province
    ADD CONSTRAINT province_pk PRIMARY KEY (name, country);


--
-- Name: province_population province_population_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.province_population
    ADD CONSTRAINT province_population_pk PRIMARY KEY (country, province, year);


--
-- Name: religion religion_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.religion
    ADD CONSTRAINT religion_pk PRIMARY KEY (name, country);


--
-- Name: river_on_island river_on_island_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.river_on_island
    ADD CONSTRAINT river_on_island_pk PRIMARY KEY (river);


--
-- Name: river river_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.river
    ADD CONSTRAINT river_pk PRIMARY KEY (name);


--
-- Name: river_through river_through_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.river_through
    ADD CONSTRAINT river_through_pk PRIMARY KEY (river, lake);


--
-- Name: sea sea_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sea
    ADD CONSTRAINT sea_pk PRIMARY KEY (name);


--
-- Name: TABLE borders; Type: ACL; Schema: public; Owner: -
--

-- GRANT SELECT ON TABLE public.borders TO lab;


--
-- Name: TABLE continent; Type: ACL; Schema: public; Owner: -
--

-- GRANT SELECT ON TABLE public.continent TO lab;


--
-- Name: TABLE country; Type: ACL; Schema: public; Owner: -
--

-- GRANT SELECT ON TABLE public.country TO lab;


--
-- Name: TABLE desert; Type: ACL; Schema: public; Owner: -
--

-- GRANT SELECT ON TABLE public.desert TO lab;


--
-- Name: TABLE encompasses; Type: ACL; Schema: public; Owner: -
--

-- GRANT SELECT ON TABLE public.encompasses TO lab;


--
-- Name: TABLE geo_desert; Type: ACL; Schema: public; Owner: -
--

-- GRANT SELECT ON TABLE public.geo_desert TO lab;


--
-- Name: TABLE geo_island; Type: ACL; Schema: public; Owner: -
--

-- GRANT SELECT ON TABLE public.geo_island TO lab;


--
-- Name: TABLE geo_lake; Type: ACL; Schema: public; Owner: -
--

-- GRANT SELECT ON TABLE public.geo_lake TO lab;


--
-- Name: TABLE geo_mountain; Type: ACL; Schema: public; Owner: -
--

-- GRANT SELECT ON TABLE public.geo_mountain TO lab;


--
-- Name: TABLE geo_river; Type: ACL; Schema: public; Owner: -
--

-- GRANT SELECT ON TABLE public.geo_river TO lab;


--
-- Name: TABLE geo_sea; Type: ACL; Schema: public; Owner: -
--

-- GRANT SELECT ON TABLE public.geo_sea TO lab;


--
-- Name: TABLE is_member; Type: ACL; Schema: public; Owner: -
--

-- GRANT SELECT ON TABLE public.is_member TO lab;


--
-- Name: TABLE island; Type: ACL; Schema: public; Owner: -
--

-- GRANT SELECT ON TABLE public.island TO lab;


--
-- Name: TABLE lake; Type: ACL; Schema: public; Owner: -
--

-- GRANT SELECT ON TABLE public.lake TO lab;


--
-- Name: TABLE located; Type: ACL; Schema: public; Owner: -
--

-- GRANT SELECT ON TABLE public.located TO lab;


--
-- Name: TABLE merges_with; Type: ACL; Schema: public; Owner: -
--

-- GRANT SELECT ON TABLE public.merges_with TO lab;


--
-- Name: TABLE mountain; Type: ACL; Schema: public; Owner: -
--

-- GRANT SELECT ON TABLE public.mountain TO lab;


--
-- Name: TABLE organization; Type: ACL; Schema: public; Owner: -
--

-- GRANT SELECT ON TABLE public.organization TO lab;


--
-- Name: TABLE river; Type: ACL; Schema: public; Owner: -
--

-- GRANT SELECT ON TABLE public.river TO lab;


--
-- Name: TABLE sea; Type: ACL; Schema: public; Owner: -
--

-- GRANT SELECT ON TABLE public.sea TO lab;


--
-- Name: TABLE ws_country; Type: ACL; Schema: public; Owner: -
--

-- GRANT SELECT ON TABLE public.ws_country TO lab;


--
-- Name: TABLE ws_encompasses; Type: ACL; Schema: public; Owner: -
--

-- GRANT SELECT ON TABLE public.ws_encompasses TO lab;


--
-- Name: TABLE ws_organization; Type: ACL; Schema: public; Owner: -
--

-- GRANT SELECT ON TABLE public.ws_organization TO lab;


--
-- Name: TABLE ws_is_member; Type: ACL; Schema: public; Owner: -
--

-- GRANT SELECT ON TABLE public.ws_is_member TO lab;


--
-- Name: TABLE ws_located; Type: ACL; Schema: public; Owner: -
--

-- GRANT SELECT ON TABLE public.ws_located TO lab;


--
-- PostgreSQL database dump complete
--

