# Data Visualisation based on Conceptual Modelling: Relevant Code
This is the codebase for the MSc Advanced Computing project.

====
## Prerequisite
- Installed [Node.js](https://nodejs.org/en/download/) runtime;
- Installed [PostgreSQL](https://www.postgresql.org/download/) RDBMS. Make sure the database service is running;
- Terminal tools. At least two concurrent terminal windows will be used.
## Running the instance
1. Using any valid database management tool or [command line instructions](https://stackoverflow.com/a/6842496), import the MONDIAL database dumps in the `db` folder for the MONDIAL database as a PostgreSQL instance. Import the SQL files in the following order: `mondial-postgres-schema.sql`, `mondial-postgres-inputs.sql`, `mondial-postgres-fk.sql`.
2. Go to `backend/` folder and execute `npm install`. 
3. Create a file called `pg-connections.yaml` in the folder `backend/`, and fill the following information into this file:
```
user: < username of the mondial instance >
host: < host URL of the database instance. If the instance is located on the same device, this should be localhost >
database:< name of the database instance >
password: < password, if any, for the database instance >
port: < port address of the database instance. By default, this is 5432 >
```
4. Make sure the postgresql service is running, then start the backend server by executing `npm start`.
5. In another terminal window, go to `frontend/` and execute `npm install`, then `npm build`. Start frontend software by executing `npm start`.