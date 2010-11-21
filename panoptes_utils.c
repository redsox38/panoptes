/*
 *
 * Copyright (C) 2010 Todd Merritt <redsox38@gmail.com>
 *
 *    This program is free software: you can redistribute it and/or modify
 *    it under the terms of the GNU General Public License as published by
 *    the Free Software Foundation, either version 3 of the License, or
 *    (at your option) any later version.
 *
 *    This program is distributed in the hope that it will be useful,
 *    but WITHOUT ANY WARRANTY; without even the implied warranty of
 *    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *    GNU General Public License for more details.
 *
 *    You should have received a copy of the GNU General Public License
 *    along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 */

#include "panoptes.h"
#include <sys/ioctl.h>
#include <string.h>
#include <unistd.h>
#include <fcntl.h>
#include <sys/stat.h>

void set_pidfile(char *pid_file_name)
{
   int  pid, fd;
   char pidbuf[16];

   if ((fd = open(pid_file_name, O_RDWR|O_CREAT, S_IRUSR|S_IRGRP|S_IROTH)) >= 0){
     pid = getpid();   
     memset((void *)pidbuf, 0x0, sizeof(pidbuf));
     snprintf(pidbuf, sizeof(pidbuf), "%d\n", pid);
     write(fd, pidbuf, strlen(pidbuf));
     close(fd);
   } else {
     fprintf(stderr, "Couldn't open %s, aborting.\n", pid_file_name);
     exit(-1);
   }
}

/* function to become daemon */
void disconnect_from_tty()
{
  int tt;
  
  if ((tt = open("/dev/tty", 2)) >= 0) {
    ioctl(tt, TIOCNOTTY, (char *)0);
    close(tt);
  }
  close(0);
  close(1);
  close(2);
}
