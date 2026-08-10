-- ============================================================
-- Segundo caminho de cupom: desconto aplicado pelo admin direto no cliente,
-- sem código. Além disso, unifica como o desconto pendente chega ao webhook
-- (percentual + duração, em vez de reconsultar o código).
-- ============================================================

alter table public.psychologists
  -- Desconto reservado pelo admin: entra sozinho no próximo checkout do cliente.
  add column if not exists admin_discount_pct int,
  add column if not exists admin_discount_duration text, -- first_payment | first_year | forever
  -- Desconto escolhido no checkout, aplicado quando o pagamento confirma.
  add column if not exists pending_coupon_pct int,
  add column if not exists pending_coupon_duration text;
