// Loads a module of the card (or a dependency the card adds) when the test
// runs. Vite resolves a string-literal `import("...")` while it transforms the
// file, so a missing module would fail the whole file at load ("no tests").
// With the specifier in a variable, a missing module fails the test that needs
// it, as a named failed test. `specifier` is root-relative ("/src/api/client")
// or a package name ("next-intl").
export async function load<T>(specifier: string): Promise<T> {
  return (await import(/* @vite-ignore */ specifier)) as T;
}
