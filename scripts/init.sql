-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Enable Row Level Security helper function
CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS UUID AS $$
BEGIN
  RETURN current_setting('app.current_tenant_id', true)::UUID;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Text search configuration for Brazilian Portuguese
CREATE TEXT SEARCH CONFIGURATION IF NOT EXISTS pt_br (COPY = pg_catalog.portuguese);

-- DEMO DATA SUL BR
-- Plans
INSERT INTO plans (id, type, name, price_monthly_cents, price_yearly_cents, features, maxUsers, maxStorage_gb, support_level, is_active)
VALUES 
  ('00000000-0000-0000-0000-000000000001'::uuid, 'starter', 'Starter', 0, 0, '["14 dias grátis", "1 corretor", "Imóveis ilimitados"]', 1, 5, 'basic', true);

-- Tenant Demo POA
INSERT INTO tenants (id, plan_id, name, slug, cnpj, email, phone, status, trial_ends_at, primary_color, business_hours, timezone)
VALUES 
  ('demo-tenant-po a'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, 'Imobiliária Guaíba Luxo', 'demo', '12.345.678/0001-99', 'contato@guai baluxo.com', '(51) 99988-7766', 'trial', '2024-12-31', '#3B82F6', '["seg-sex 9-18"]', 'America/Sao_Paulo');

-- User Demo
INSERT INTO users (id, tenant_id, email, password_hash, full_name, role, is_active)
VALUES 
  ('demo-user-1'::uuid, 'demo-tenant-po a'::uuid, 'admin@imobi.com', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'João Silva - Owner', 'owner', true);  -- pass: admin123

-- Property Types
INSERT INTO property_types (id, tenant_id, name, icon)
VALUES 
  ('apt'::uuid, 'demo-tenant-po a'::uuid, 'Apartamento', 'building-2'),
  ('cobertura'::uuid, 'demo-tenant-po a'::uuid, 'Cobertura', 'building-2'),
  ('casa'::uuid, 'demo-tenant-po a'::uuid, 'Casa', 'home');

-- Lead Sources
INSERT INTO lead_sources (id, tenant_id, name, type, color)
VALUES 
  ('wa'::uuid, 'demo-tenant-po a'::uuid, 'WhatsApp', 'whatsapp', '#25D366'),
  ('zap'::uuid, 'demo-tenant-po a'::uuid, 'ZAP Imóveis', 'portal', '#00A651');

-- Properties Luxo Sul BR
INSERT INTO properties (id, tenant_id, code, title, description, type_id, transaction_type, status, price_sale, area_total, bedrooms, bathrooms, suites, address_city, address_state, latitude, longitude, features, cover_image_url)
VALUES 
  -- POA Cobertura
  ('prop-po a-1'::uuid, 'demo-tenant-po a'::uuid, 'AP001', 'Cobertura Duplex Guaíba View - Moinhos de Vento', 'Vista panorâmica Rio Guaíba, 450m², 4 suítes, piscina priv.', 'cobertura'::uuid, 'sale', 'active', 650000000, 450, 4, 5, 4, 'Porto Alegre', 'RS', -30.0247, -51.2263, '["piscina", "sauna", "academia", "heliponto"]', 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'),
  -- Curitiba Chácara
  ('prop-cur-1'::uuid, 'demo-tenant-po a'::uuid, 'CS001', 'Chácara Luxo Batel - 5.000m² Terreno', 'Casa 800m² + piscina infinita, bosque nativo, ecad', 'casa'::uuid, 'sale', 'active', 850000000, 800, 5, 6, 5, 'Curitiba', 'PR', -25.4284, -49.2734, '["piscina infinita", "spa", "cinema", "helipad"]', 'https://images.unsplash.com/photo-1600607687929-553bac420f89?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'),
  -- Floripa Beachfront
  ('prop-fln-1'::uuid, 'demo-tenant-po a'::uuid, 'BF001', 'Beachfront Jurerê Internacional - Heliponto', '3 pavimentos frente mar, 1.200m², cinema priv', 'casa'::uuid, 'sale', 'active', 1200000000, 1200, 6, 8, 6, 'Florianópolis', 'SC', -27.4305, -48.3891, '["beachfront", "heliponto", "piscina oceano", "elevador"]', 'https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2071&q=80');

-- Clients/Leads fictícios Sul BR
INSERT INTO contacts (id, tenant_id, full_name, email, phone_whatsapp, type, lead_score, lead_source_id, address_city, address_state)
VALUES 
  ('contact-1'::uuid, 'demo-tenant-po a'::uuid, 'João Pedro Oliveira', 'joao@curitiba-invest.com.br', '(41) 99912-3456', 'lead', 95, 'wa'::uuid, 'Curitiba', 'PR'),
  ('contact-2'::uuid, 'demo-tenant-po a'::uuid, 'Maria Fernandes RS', 'maria@invest-rs.com', '(51) 99876-5432', 'client', 100, 'zap'::uuid, 'Porto Alegre', 'RS'),
  ('contact-3'::uuid, 'demo-tenant-po a'::uuid, 'Pedro Costa Floripa', 'pedro@luxsc.com.br', '(48) 99123-4567', 'lead', 80, 'wa'::uuid, 'Florianópolis', 'SC');

COMMIT;
