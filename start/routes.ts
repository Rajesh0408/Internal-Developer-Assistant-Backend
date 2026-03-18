/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'

router.get('/', async () => {
  return {
    hello: 'world',
  }
})

/*
|--------------------------------------------------------------------------
| Auth Routes (PUBLIC)
|--------------------------------------------------------------------------
*/
router.post('/auth/signup', '#controllers/auth_controller.signup')
router.post('/auth/login', '#controllers/auth_controller.login')


/*
|--------------------------------------------------------------------------
| Protected API Routes (JWT)
|--------------------------------------------------------------------------
*/
router
  .group(() => {
    // Questions
    router.post('/questions', '#controllers/questions_controller.store')
    router.get('/questions', '#controllers/questions_controller.index')
    router.get('/questions/search', '#controllers/questions_controller.search')
    router.get('/questions/:id', '#controllers/questions_controller.show')
    router.delete('/questions/:id', '#controllers/questions_controller.destroy')

    // Answers
    router.post('/answers', '#controllers/answers_controller.store')
    router.delete('/answers/:id', '#controllers/answers_controller.destroy')

    // Votes
    router.post('/votes', '#controllers/votes_controller.store')

    // Documents (Knowledge Base)
    router.get('/documents', '#controllers/documents_controller.index')
    router.post('/documents', '#controllers/documents_controller.upload').middleware(middleware.role({ role: 'admin' }))
    router.delete('/documents/:id', '#controllers/documents_controller.destroy').middleware(middleware.role({ role: 'admin' }))
// Users
    router.get('/users/me/stats', '#controllers/users_controller.stats')
    router.get('/users/me', '#controllers/users_controller.me')
    router.put('/users/me', '#controllers/users_controller.updateProfile')
    router.get('/users/:id/profile', '#controllers/users_controller.showProfile')
    router.post('/users/:id/follow', '#controllers/users_controller.follow')
    router.delete('/users/:id/unfollow', '#controllers/users_controller.unfollow')
    router.get('/users/me/followers', '#controllers/users_controller.followers')
    router.get('/users/me/following', '#controllers/users_controller.following')
    
    router.get('/admin/stats', '#controllers/users_controller.globalStats').middleware(middleware.role({ role: 'admin' }))
    router.get('/users', '#controllers/users_controller.index').middleware(middleware.role({ role: 'admin' }))
    router.post('/users', '#controllers/users_controller.adminCreate').middleware(middleware.role({ role: 'admin' }))
    router.patch('/users/:id/role', '#controllers/users_controller.updateRole').middleware(middleware.role({ role: 'admin' }))
    router.delete('/users/:id', '#controllers/users_controller.destroy').middleware(middleware.role({ role: 'admin' }))

    router.get('/notifications', '#controllers/notifications_controller.index')
    router.patch('/notifications/:id/read', '#controllers/notifications_controller.markAsRead')
  })
  .prefix('/api')
  .middleware(middleware.jwt())
