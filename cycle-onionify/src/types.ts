export type MainFn<So, Si> = (sources: So) => Si;
export type Reducer<T> = (state: T | undefined) => T | undefined;
export type Getter<T, R> = (state: T | undefined) => R | undefined;
export type Setter<T, R> = (
  state: T | undefined,
  childState: R | undefined,
) => T | undefined;
export type Lens<T, R> = {
  get: Getter<T, R>;
  set: Setter<T, R>;
};
export type Scope<T, R> = string | number | Lens<T, R>;
export type Instances<Si> = {
  dict: Map<string, Si>;
  arr: Array<Si & {_key: string}>;
};
