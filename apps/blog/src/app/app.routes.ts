import { createBlogRoutes } from '@foliokit/cms-ui';
import { postResolver } from './resolvers/post.resolver';

export const appRoutes = createBlogRoutes({ postResolver });
