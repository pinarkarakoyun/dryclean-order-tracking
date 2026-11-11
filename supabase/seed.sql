-- DEMO DATA ONLY: fictional customers and example prices. Never real customer data.
-- Run once, after 0001-0003. A second run stops on the unique tracking tokens.
-- Orders and status changes go through the same functions the app uses, so the history exists too.

insert into public.price_list_items (name, price_kurus, sort_order)
select name, price_kurus, sort_order
from (values
  ('Gömlek', 12000, 1),
  ('Pantolon', 15000, 2),
  ('Etek', 15000, 3),
  ('Kazak', 18000, 4),
  ('Ceket', 25000, 5),
  ('Elbise', 30000, 6),
  ('Takım elbise', 40000, 7),
  ('Mont / Palto', 45000, 8)
) as demo (name, price_kurus, sort_order)
where not exists (select 1 from public.price_list_items);

do $$
declare
  v_shirt uuid := (select id from public.price_list_items where name = 'Gömlek');
  v_trousers uuid := (select id from public.price_list_items where name = 'Pantolon');
  v_suit uuid := (select id from public.price_list_items where name = 'Takım elbise');
  v_order public.orders;
  v_a public.order_items;
  v_b public.order_items;
  v_c public.order_items;
begin
  -- 1) Express order, items at different steps.
  v_order := public.create_order('Ahmet Yıldız', '+905550000001', 'demo-Qm3vX8kP2rT7wZ1yL5nB9cF4');
  update public.orders
  set express_percent = 50,
      estimated_ready_date = current_date + 1,
      public_description = 'Ekspres temizlik'
  where id = v_order.id;
  v_a := public.add_order_item(v_order.id, 'Gömlek', v_shirt, 12000, 'A1', null);
  v_b := public.add_order_item(v_order.id, 'Pantolon', v_trousers, 15000, 'A1', 'Dizde leke var');
  perform public.change_item_status(v_a.id, 'RECEIVED', 'CLEANING', 'normal');
  perform public.change_item_status(v_a.id, 'CLEANING', 'IRONING', 'normal');
  perform public.change_item_status(v_a.id, 'IRONING', 'READY', 'normal');
  perform public.change_item_status(v_b.id, 'RECEIVED', 'CLEANING', 'normal');

  -- 2) Order without items yet (quick creation).
  v_order := public.create_order('Elif Demir', '+905550000002', 'demo-Hs8dN2qW6eR4tY9uI3oP7aS1');
  update public.orders set estimated_ready_date = current_date + 3 where id = v_order.id;

  -- 3) Fully cancelled order.
  v_order := public.create_order('Mehmet Kaya', '+905550000003', 'demo-Lp5kJ7hG3fD1sA9zX2cV8bN6');
  v_a := public.add_order_item(v_order.id, 'Halı', null, null, null, 'Müşteri vazgeçti');
  perform public.change_item_status(v_a.id, 'RECEIVED', 'CANCELLED', 'normal');

  -- 4) Ready, one item already picked up; one hand-typed item without a price.
  v_order := public.create_order('Ahmet Yıldız', '+905550000001', 'demo-Wt4yU6iO8pA2sD5fG7hJ9kL3');
  update public.orders set estimated_ready_date = current_date where id = v_order.id;
  v_a := public.add_order_item(v_order.id, 'Takım elbise', v_suit, 40000, 'B2', null);
  v_b := public.add_order_item(v_order.id, 'Gömlek', v_shirt, 12000, 'B2', null);
  v_c := public.add_order_item(v_order.id, 'Perde', null, null, 'Depo', 'Fiyat ölçüye göre');
  perform public.change_item_status(v_a.id, 'RECEIVED', 'CLEANING', 'normal');
  perform public.change_item_status(v_a.id, 'CLEANING', 'IRONING', 'normal');
  perform public.change_item_status(v_a.id, 'IRONING', 'READY', 'normal');
  perform public.change_item_status(v_a.id, 'READY', 'DELIVERED', 'normal');
  perform public.change_item_status(v_b.id, 'RECEIVED', 'CLEANING', 'normal');
  perform public.change_item_status(v_b.id, 'CLEANING', 'IRONING', 'normal');
  perform public.change_item_status(v_b.id, 'IRONING', 'READY', 'normal');
  perform public.change_item_status(v_c.id, 'RECEIVED', 'CLEANING', 'normal');
  perform public.change_item_status(v_c.id, 'CLEANING', 'IRONING', 'normal');
  perform public.change_item_status(v_c.id, 'IRONING', 'READY', 'normal');
end;
$$;

select o.order_number, c.name, count(i.id) as items
from public.orders o
join public.customers c on c.id = o.customer_id
left join public.order_items i on i.order_id = o.id
group by o.order_number, c.name
order by o.order_number;
