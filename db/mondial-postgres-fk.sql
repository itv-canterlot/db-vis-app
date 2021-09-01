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
-- Name: airport airport_city_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.airport
    ADD CONSTRAINT airport_city_fk FOREIGN KEY (city, province, country) REFERENCES public.city(name, province, country);


--
-- Name: borders border_country_a_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.borders
    ADD CONSTRAINT border_country_a_fk FOREIGN KEY (country1) REFERENCES public.country(code);


--
-- Name: borders border_country_b_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.borders
    ADD CONSTRAINT border_country_b_fk FOREIGN KEY (country2) REFERENCES public.country(code);


--
-- Name: organization city_local_name_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization
    ADD CONSTRAINT city_local_name_fk FOREIGN KEY (city, province, country) REFERENCES public.city(name, province, country);


--
-- Name: city_local_name city_local_name_isa; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.city_local_name
    ADD CONSTRAINT city_local_name_isa FOREIGN KEY (city, province, country) REFERENCES public.city(name, province, country);


--
-- Name: city_other_name city_other_name_we; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.city_other_name
    ADD CONSTRAINT city_other_name_we FOREIGN KEY (city, province, country) REFERENCES public.city(name, province, country);


--
-- Name: city_population city_population_we; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.city_population
    ADD CONSTRAINT city_population_we FOREIGN KEY (city, province, country) REFERENCES public.city(name, province, country);


--
-- Name: city city_province_we; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.city
    ADD CONSTRAINT city_province_we FOREIGN KEY (province, country) REFERENCES public.province(name, country);


--
-- Name: country country_capital_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.country
    ADD CONSTRAINT country_capital_fk FOREIGN KEY (capital, province, code) REFERENCES public.city(name, province, country);


--
-- Name: country_local_name country_local_name_country_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.country_local_name
    ADD CONSTRAINT country_local_name_country_fkey FOREIGN KEY (country) REFERENCES public.country(code);


--
-- Name: country_local_name country_local_name_isa; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.country_local_name
    ADD CONSTRAINT country_local_name_isa FOREIGN KEY (country) REFERENCES public.country(code);


--
-- Name: country_other_name country_other_name_country_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.country_other_name
    ADD CONSTRAINT country_other_name_country_fkey FOREIGN KEY (country) REFERENCES public.country(code);


--
-- Name: country_other_name country_other_name_we; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.country_other_name
    ADD CONSTRAINT country_other_name_we FOREIGN KEY (country) REFERENCES public.country(code);


--
-- Name: country_population country_population_country_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.country_population
    ADD CONSTRAINT country_population_country_fkey FOREIGN KEY (country) REFERENCES public.country(code);


--
-- Name: economy economy_country_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.economy
    ADD CONSTRAINT economy_country_fkey FOREIGN KEY (country) REFERENCES public.country(code);


--
-- Name: economy economy_isa; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.economy
    ADD CONSTRAINT economy_isa FOREIGN KEY (country) REFERENCES public.country(code);


--
-- Name: encompasses encompasses_continent_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.encompasses
    ADD CONSTRAINT encompasses_continent_fk FOREIGN KEY (continent) REFERENCES public.continent(name);


--
-- Name: encompasses encompasses_country_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.encompasses
    ADD CONSTRAINT encompasses_country_fk FOREIGN KEY (country) REFERENCES public.country(code);


--
-- Name: ethnic_group ethnic_group_country_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ethnic_group
    ADD CONSTRAINT ethnic_group_country_fkey FOREIGN KEY (country) REFERENCES public.country(code);


--
-- Name: ethnic_group ethnic_group_we; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ethnic_group
    ADD CONSTRAINT ethnic_group_we FOREIGN KEY (country) REFERENCES public.country(code);


--
-- Name: geo_desert geo_desert_desert_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.geo_desert
    ADD CONSTRAINT geo_desert_desert_fk FOREIGN KEY (desert) REFERENCES public.desert(name);


--
-- Name: geo_desert geo_desert_province_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.geo_desert
    ADD CONSTRAINT geo_desert_province_fk FOREIGN KEY (province, country) REFERENCES public.province(name, country);


--
-- Name: geo_estuary geo_estuary_province_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.geo_estuary
    ADD CONSTRAINT geo_estuary_province_fk FOREIGN KEY (province, country) REFERENCES public.province(name, country);


--
-- Name: geo_estuary geo_estuary_river_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.geo_estuary
    ADD CONSTRAINT geo_estuary_river_fk FOREIGN KEY (river) REFERENCES public.river(name);


--
-- Name: geo_island geo_island_country_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.geo_island
    ADD CONSTRAINT geo_island_country_fk FOREIGN KEY (country) REFERENCES public.country(code);


--
-- Name: geo_island geo_island_island_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.geo_island
    ADD CONSTRAINT geo_island_island_fk FOREIGN KEY (island) REFERENCES public.island(name);


--
-- Name: geo_island geo_island_province_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.geo_island
    ADD CONSTRAINT geo_island_province_fk FOREIGN KEY (province, country) REFERENCES public.province(name, country);


--
-- Name: geo_river geo_island_province_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.geo_river
    ADD CONSTRAINT geo_island_province_fk FOREIGN KEY (province, country) REFERENCES public.province(name, country);


--
-- Name: geo_lake geo_lake_lake_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.geo_lake
    ADD CONSTRAINT geo_lake_lake_fk FOREIGN KEY (lake) REFERENCES public.lake(name);


--
-- Name: geo_lake geo_lake_province_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.geo_lake
    ADD CONSTRAINT geo_lake_province_fk FOREIGN KEY (province, country) REFERENCES public.province(name, country);


--
-- Name: geo_mountain geo_mountain_mountain_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.geo_mountain
    ADD CONSTRAINT geo_mountain_mountain_fk FOREIGN KEY (mountain) REFERENCES public.mountain(name);


--
-- Name: geo_mountain geo_mountain_province_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.geo_mountain
    ADD CONSTRAINT geo_mountain_province_fk FOREIGN KEY (province, country) REFERENCES public.province(name, country);


--
-- Name: geo_river geo_river_country_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.geo_river
    ADD CONSTRAINT geo_river_country_fk FOREIGN KEY (country) REFERENCES public.country(code);


--
-- Name: geo_river geo_river_river_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.geo_river
    ADD CONSTRAINT geo_river_river_fk FOREIGN KEY (river) REFERENCES public.river(name);


--
-- Name: geo_sea geo_sea_province_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.geo_sea
    ADD CONSTRAINT geo_sea_province_fk FOREIGN KEY (province, country) REFERENCES public.province(name, country);


--
-- Name: geo_sea geo_sea_sea_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.geo_sea
    ADD CONSTRAINT geo_sea_sea_fk FOREIGN KEY (sea) REFERENCES public.sea(name);


--
-- Name: geo_source geo_source_province_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.geo_source
    ADD CONSTRAINT geo_source_province_fk FOREIGN KEY (province, country) REFERENCES public.province(name, country);


--
-- Name: geo_source geo_source_river_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.geo_source
    ADD CONSTRAINT geo_source_river_fk FOREIGN KEY (river) REFERENCES public.river(name);


--
-- Name: is_member is_member_country_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.is_member
    ADD CONSTRAINT is_member_country_fk FOREIGN KEY (country) REFERENCES public.country(code);


--
-- Name: is_member is_member_organization_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.is_member
    ADD CONSTRAINT is_member_organization_fk FOREIGN KEY (organization) REFERENCES public.organization(abbreviation);


--
-- Name: lake_on_island lake_on_island_island_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lake_on_island
    ADD CONSTRAINT lake_on_island_island_fk FOREIGN KEY (island) REFERENCES public.island(name);


--
-- Name: lake_on_island lake_on_island_lake_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lake_on_island
    ADD CONSTRAINT lake_on_island_lake_fk FOREIGN KEY (lake) REFERENCES public.lake(name);


--
-- Name: lake lake_river_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lake
    ADD CONSTRAINT lake_river_fk FOREIGN KEY (river) REFERENCES public.river(name);


--
-- Name: language language_country_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.language
    ADD CONSTRAINT language_country_fkey FOREIGN KEY (country) REFERENCES public.country(code);


--
-- Name: language language_we; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.language
    ADD CONSTRAINT language_we FOREIGN KEY (country) REFERENCES public.country(code);


--
-- Name: located located_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.located
    ADD CONSTRAINT located_fk FOREIGN KEY (city, province, country) REFERENCES public.city(name, province, country);


--
-- Name: located located_geo_lake; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.located
    ADD CONSTRAINT located_geo_lake FOREIGN KEY (province, country, lake) REFERENCES public.geo_lake(province, country, lake);


--
-- Name: located located_geo_river; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.located
    ADD CONSTRAINT located_geo_river FOREIGN KEY (province, country, river) REFERENCES public.geo_river(province, country, river);


--
-- Name: located located_geo_sea; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.located
    ADD CONSTRAINT located_geo_sea FOREIGN KEY (province, country, sea) REFERENCES public.geo_sea(province, country, sea);


--
-- Name: located located_lake_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.located
    ADD CONSTRAINT located_lake_fk FOREIGN KEY (lake) REFERENCES public.lake(name);


--
-- Name: located_on located_on_city_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.located_on
    ADD CONSTRAINT located_on_city_fk FOREIGN KEY (city, province, country) REFERENCES public.city(name, province, country);


--
-- Name: located_on located_on_island_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.located_on
    ADD CONSTRAINT located_on_island_fk FOREIGN KEY (island) REFERENCES public.island(name);


--
-- Name: located located_river_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.located
    ADD CONSTRAINT located_river_fk FOREIGN KEY (river) REFERENCES public.river(name);


--
-- Name: located located_sea_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.located
    ADD CONSTRAINT located_sea_fk FOREIGN KEY (sea) REFERENCES public.sea(name);


--
-- Name: merges_with merges_with_sea_a_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.merges_with
    ADD CONSTRAINT merges_with_sea_a_fk FOREIGN KEY (sea1) REFERENCES public.sea(name);


--
-- Name: merges_with merges_with_sea_b_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.merges_with
    ADD CONSTRAINT merges_with_sea_b_fk FOREIGN KEY (sea2) REFERENCES public.sea(name);


--
-- Name: mountain_on_island mountain_on_island_island_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mountain_on_island
    ADD CONSTRAINT mountain_on_island_island_fk FOREIGN KEY (island) REFERENCES public.island(name);


--
-- Name: mountain_on_island mountain_on_island_mountain_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mountain_on_island
    ADD CONSTRAINT mountain_on_island_mountain_fk FOREIGN KEY (mountain) REFERENCES public.mountain(name);


--
-- Name: politics politics_dependent_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.politics
    ADD CONSTRAINT politics_dependent_fkey FOREIGN KEY (dependent) REFERENCES public.country(code);


--
-- Name: politics politics_isa; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.politics
    ADD CONSTRAINT politics_isa FOREIGN KEY (country) REFERENCES public.country(code);


--
-- Name: population population_country_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.population
    ADD CONSTRAINT population_country_fkey FOREIGN KEY (country) REFERENCES public.country(code);


--
-- Name: population population_isa; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.population
    ADD CONSTRAINT population_isa FOREIGN KEY (country) REFERENCES public.country(code);


--
-- Name: province province_country_we; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.province
    ADD CONSTRAINT province_country_we FOREIGN KEY (country) REFERENCES public.country(code);


--
-- Name: province_local_name province_local_name_isa; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.province_local_name
    ADD CONSTRAINT province_local_name_isa FOREIGN KEY (province, country) REFERENCES public.province(name, country);


--
-- Name: province_other_name province_other_name_we; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.province_other_name
    ADD CONSTRAINT province_other_name_we FOREIGN KEY (province, country) REFERENCES public.province(name, country);


--
-- Name: province_population province_population_we; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.province_population
    ADD CONSTRAINT province_population_we FOREIGN KEY (province, country) REFERENCES public.province(name, country);


--
-- Name: religion religion_country_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.religion
    ADD CONSTRAINT religion_country_fkey FOREIGN KEY (country) REFERENCES public.country(code);


--
-- Name: religion religion_we; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.religion
    ADD CONSTRAINT religion_we FOREIGN KEY (country) REFERENCES public.country(code);


--
-- Name: river river_lake_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.river
    ADD CONSTRAINT river_lake_fk FOREIGN KEY (lake) REFERENCES public.lake(name);


--
-- Name: river_on_island river_on_island_island_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.river_on_island
    ADD CONSTRAINT river_on_island_island_fk FOREIGN KEY (island) REFERENCES public.island(name);


--
-- Name: river_on_island river_on_island_river_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.river_on_island
    ADD CONSTRAINT river_on_island_river_fk FOREIGN KEY (river) REFERENCES public.river(name);


--
-- Name: river river_sea_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.river
    ADD CONSTRAINT river_sea_fk FOREIGN KEY (sea) REFERENCES public.sea(name);


--
-- Name: river_through river_through_lake_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.river_through
    ADD CONSTRAINT river_through_lake_fkey FOREIGN KEY (lake) REFERENCES public.lake(name);


--
-- Name: river_through river_through_river_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.river_through
    ADD CONSTRAINT river_through_river_fkey FOREIGN KEY (river) REFERENCES public.river(name);


--
-- Name: river tributary_to; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.river
    ADD CONSTRAINT tributary_to FOREIGN KEY (river) REFERENCES public.river(name);


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

