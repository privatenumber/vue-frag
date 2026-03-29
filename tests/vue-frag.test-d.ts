import { expectTypeOf } from 'expect-type';
import type { ComponentOptions } from 'vue';
import type Vue from 'vue';
import { Fragment } from '..';

type FragmentComponent = ComponentOptions<Vue, never, never, never, never, never> & {
	name: 'Fragment';
};

expectTypeOf(Fragment.name).toEqualTypeOf<FragmentComponent['name']>();
expectTypeOf(Fragment).toEqualTypeOf<FragmentComponent>();
