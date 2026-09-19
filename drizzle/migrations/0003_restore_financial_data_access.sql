DROP POLICY IF EXISTS "paid own accounts" ON public.accounts;
CREATE POLICY "own accounts"
ON public.accounts
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "paid categories select" ON public.categories;
CREATE POLICY "categories select"
ON public.categories
FOR SELECT
TO authenticated
USING (user_id IS NULL OR auth.uid() = user_id);

DROP POLICY IF EXISTS "paid categories write" ON public.categories;
CREATE POLICY "own categories write"
ON public.categories
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "paid own recurrences" ON public.recurring_transactions;
CREATE POLICY "own recurrences"
ON public.recurring_transactions
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "paid own transactions" ON public.transactions;
CREATE POLICY "own transactions"
ON public.transactions
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);