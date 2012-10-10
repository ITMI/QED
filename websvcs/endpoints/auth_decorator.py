import functools
import tornado.web
from tornado.options import define, options, logging

def authenticated(method):
    """Decorate methods with this to require that the user be logged in."""
    @functools.wraps(method)
    def wrapper(self, *args, **kwargs):
        whoami = self.get_cookie("whoami")
        if not whoami:
            raise tornado.web.HTTPError(403)

        if not whoami in options.authorized_users:
            raise tornado.web.HTTPError(403)
                    
        return method(self, *args, **kwargs)
    return wrapper
