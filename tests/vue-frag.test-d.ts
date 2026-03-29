import { expectType } from 'tsd';
import type { ComponentOptions } from 'vue';
import type Vue from 'vue';
import { Fragment } from '..';

type FragmentComponent = ComponentOptions<Vue, never, never, never, never, never> & {
	name: 'Fragment';
};

expectType<FragmentComponent['name']>(Fragment.name);
expectType<FragmentComponent>(Fragment);
