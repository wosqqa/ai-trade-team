export async function discoverySchema(conn){
for(const sql of [
`CREATE TABLE IF NOT EXISTS yt_prospect_plans (id CHAR(36) PRIMARY KEY,name VARCHAR(160) NOT NULL,config JSON NOT NULL,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
`CREATE TABLE IF NOT EXISTS yt_prospect_tasks (id CHAR(36) PRIMARY KEY,plan_id CHAR(36) NOT NULL,config JSON NOT NULL,provider VARCHAR(20) NOT NULL,status VARCHAR(30) NOT NULL DEFAULT 'queued',message VARCHAR(500) NOT NULL DEFAULT '',calls_used INT NOT NULL DEFAULT 0,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,FOREIGN KEY(plan_id) REFERENCES yt_prospect_plans(id))`,
`CREATE TABLE IF NOT EXISTS yt_prospect_leads (id CHAR(36) PRIMARY KEY,task_id CHAR(36) NOT NULL,name VARCHAR(200) NOT NULL,url VARCHAR(1000) NOT NULL,url_hash CHAR(64) NOT NULL,platform VARCHAR(30) NOT NULL,country VARCHAR(100) NOT NULL DEFAULT '',evidence TEXT NOT NULL,score INT NOT NULL DEFAULT 0,reasons JSON NOT NULL,status VARCHAR(30) NOT NULL DEFAULT 'pending',review_note VARCHAR(500) NOT NULL DEFAULT '',customer_id CHAR(36),created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,UNIQUE KEY task_url(task_id,url_hash),FOREIGN KEY(task_id) REFERENCES yt_prospect_tasks(id),FOREIGN KEY(customer_id) REFERENCES yt_customers(id))`,
`CREATE TABLE IF NOT EXISTS yt_prospect_sources (url_hash CHAR(64) PRIMARY KEY,url VARCHAR(1000) NOT NULL,customer_id CHAR(36) NOT NULL,FOREIGN KEY(customer_id) REFERENCES yt_customers(id))`
])await conn.query(sql);
}
