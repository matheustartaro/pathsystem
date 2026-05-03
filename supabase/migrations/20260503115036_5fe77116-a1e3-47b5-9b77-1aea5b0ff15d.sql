
-- Tighten responsaveis: require authenticated
DROP POLICY IF EXISTS "Allow public delete access on responsaveis" ON public.responsaveis;
DROP POLICY IF EXISTS "Allow public insert access on responsaveis" ON public.responsaveis;
DROP POLICY IF EXISTS "Allow public read access on responsaveis" ON public.responsaveis;
DROP POLICY IF EXISTS "Allow public update access on responsaveis" ON public.responsaveis;

CREATE POLICY "Authenticated can read responsaveis" ON public.responsaveis
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers can insert responsaveis" ON public.responsaveis
  FOR INSERT TO authenticated WITH CHECK (
    public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'funcionario')
  );
CREATE POLICY "Managers can update responsaveis" ON public.responsaveis
  FOR UPDATE TO authenticated USING (
    public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'funcionario')
  );
CREATE POLICY "Admins can delete responsaveis" ON public.responsaveis
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- color_palettes: keep public read, require authenticated for writes
DROP POLICY IF EXISTS "Allow public delete access on color_palettes" ON public.color_palettes;
DROP POLICY IF EXISTS "Allow public insert access on color_palettes" ON public.color_palettes;
DROP POLICY IF EXISTS "Allow public update access on color_palettes" ON public.color_palettes;

CREATE POLICY "Authenticated can insert color_palettes" ON public.color_palettes
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update color_palettes" ON public.color_palettes
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete color_palettes" ON public.color_palettes
  FOR DELETE TO authenticated USING (true);

-- profiles: restrict reads to self or admins
DROP POLICY IF EXISTS "Authenticated users can read profiles" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id OR public.has_role(auth.uid(),'admin'));

-- transactions: restrict to admins (finance)
DROP POLICY IF EXISTS "Authenticated users can manage transactions" ON public.transactions;
DROP POLICY IF EXISTS "Authenticated users can read transactions" ON public.transactions;
CREATE POLICY "Admins can read transactions" ON public.transactions
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins can insert transactions" ON public.transactions
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins can update transactions" ON public.transactions
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins can delete transactions" ON public.transactions
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- project_files: restrict to managers (admin/funcionario), block public role usage
DROP POLICY IF EXISTS "Authenticated users can manage project_files" ON public.project_files;
DROP POLICY IF EXISTS "Authenticated users can read project_files" ON public.project_files;
CREATE POLICY "Managers can read project_files" ON public.project_files
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'funcionario')
  );
CREATE POLICY "Managers can insert project_files" ON public.project_files
  FOR INSERT TO authenticated WITH CHECK (
    public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'funcionario')
  );
CREATE POLICY "Managers can update project_files" ON public.project_files
  FOR UPDATE TO authenticated USING (
    public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'funcionario')
  );
CREATE POLICY "Managers can delete project_files" ON public.project_files
  FOR DELETE TO authenticated USING (
    public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'funcionario')
  );
