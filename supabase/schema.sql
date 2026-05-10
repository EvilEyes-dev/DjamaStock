-- DjamaStock MVP Schema
-- Run this in your Supabase SQL editor

-- Enable RLS
create extension if not exists "uuid-ossp";

-- Products table
create table products (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  buy_price numeric(10,2) not null default 0,
  sell_price numeric(10,2) not null,
  quantity integer not null default 0 check (quantity >= 0),
  created_at timestamptz default now()
);

-- Sales table
create table sales (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  product_id uuid references products(id) on delete set null,
  product_name text not null,
  quantity integer not null,
  unit_price numeric(10,2) not null,
  total numeric(10,2) not null,
  payment_type text not null check (payment_type in ('cash', 'credit')),
  client_name text,
  created_at timestamptz default now()
);

-- Debts table
create table debts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  client_name text not null,
  amount numeric(10,2) not null,
  paid boolean not null default false,
  sale_id uuid references sales(id) on delete set null,
  created_at timestamptz default now()
);

-- Row Level Security
alter table products enable row level security;
alter table sales enable row level security;
alter table debts enable row level security;

create policy "users manage own products" on products for all using (auth.uid() = user_id);
create policy "users manage own sales" on sales for all using (auth.uid() = user_id);
create policy "users manage own debts" on debts for all using (auth.uid() = user_id);
